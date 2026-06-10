<?php

namespace Modules\Monetization\Services\Api;

use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Imdhemy\AppStore\Jws\AppStoreJwsVerifier;
use Imdhemy\AppStore\Jws\Parser;
use Modules\Monetization\Models\Payment;
use Modules\Monetization\Models\Subscription;

class WebhookHandlerService
{
    /**
     * Handle Apple App Store Server Notifications (V2).
     */
    public function handleAppleWebhook(string $signedPayload): bool
    {
        try {
            $jws = Parser::toJws($signedPayload);
            $verifier = new AppStoreJwsVerifier;

            if (! $verifier->verify($jws)) {
                Log::warning('Apple Webhook: Invalid JWS Signature');

                return false;
            }

            $payloadArray = json_decode($jws->getPayload(), true);

            $notificationType = $payloadArray['notificationType'] ?? '';
            $signedTransactionInfo = $payloadArray['data']['signedTransactionInfo'] ?? null;

            if (! $signedTransactionInfo) {
                Log::warning('Apple Webhook: Missing signedTransactionInfo');

                return false;
            }

            $transactionJws = Parser::toJws($signedTransactionInfo);
            $transactionData = json_decode($transactionJws->getPayload(), true);

            $originalTransactionId = $transactionData['originalTransactionId'] ?? null;
            $expiresDateMs = $transactionData['expiresDate'] ?? null;

            DB::transaction(function () use ($notificationType, $originalTransactionId, $expiresDateMs, $transactionData) {
                if ($notificationType === 'DID_RENEW' || $notificationType === 'SUBSCRIBED') {
                    $subscription = Subscription::with('plan')
                        ->where('provider_subscription_id', $originalTransactionId)
                        ->first();

                    if ($subscription) {
                        $subscription->update([
                            'ends_at' => Carbon::createFromTimestampMs($expiresDateMs),
                            'status' => 'active',
                        ]);

                        $transactionId = $transactionData['transactionId'] ?? $originalTransactionId;

                        Payment::updateOrCreate(
                            [
                                'transaction_id' => $transactionId,
                            ],
                            [
                                'user_id' => $subscription->user_id,
                                'subscription_id' => $subscription->id,
                                'plan_id' => $subscription->plan_id,
                                'amount' => $subscription->plan->final_price,
                                'currency' => $subscription->plan->currency ?? 'USD',
                                'payment_method' => 'apple',
                                'status' => 'completed',
                                'metadata' => [
                                    'notification_type' => $notificationType,
                                    'original_transaction_id' => $originalTransactionId,
                                    'transaction_id' => $transactionId,
                                ],
                            ]
                        );
                    }
                } elseif ($notificationType === 'EXPIRED') {
                    Subscription::where('provider_subscription_id', $originalTransactionId)
                        ->update(['status' => 'expired']);
                }
            });

            Log::info("Apple Webhook Handled: {$notificationType} for {$originalTransactionId}");

            return true;

        } catch (Exception $e) {
            Log::error('Apple Webhook Processing Error: '.$e->getMessage());
            throw clone $e;
        }
    }

    /**
     * Handle Google Play Real-time Developer Notifications (Pub/Sub).
     */
    public function handleGoogleWebhook(array $messageData): bool
    {
        try {
            if (! isset($messageData['data'])) {
                Log::warning('Google Webhook: Missing data payload');

                return false;
            }

            $decodedData = json_decode(base64_decode($messageData['data']), true);

            if (! isset($decodedData['subscriptionNotification'])) {
                Log::info('Google Webhook: Not a subscription notification');

                return true; // Acknowledge non-subscription events to clear from queue
            }

            $notification = $decodedData['subscriptionNotification'];
            $purchaseToken = $notification['purchaseToken'];
            $notificationType = $notification['notificationType'];

            DB::transaction(function () use ($purchaseToken, $notificationType) {
                $sub = Subscription::with('plan')->where('provider_subscription_id', $purchaseToken)->first();

                if ($sub) {
                    // 2 = SUBSCRIPTION_RENEWED, 4 = SUBSCRIPTION_PURCHASED
                    if (in_array($notificationType, [2, 4])) {
                        $sub->update(['status' => 'active']);

                        // Resolve Google subscription details using Google Play API
                        try {
                            $googleService = app(GoogleSubscriptionService::class);
                            $verifiedData = $googleService->verifyPurchase($sub->plan->google_product_id, $purchaseToken);

                            if ($verifiedData) {
                                $sub->update([
                                    'ends_at' => $verifiedData->endsAt,
                                    'trial_ends_at' => $verifiedData->trialEndsAt,
                                ]);

                                $isTrial = $verifiedData->trialEndsAt !== null && $verifiedData->trialEndsAt->isFuture();
                                $amount = $isTrial ? 0.00 : $sub->plan->final_price;
                                $transactionId = $purchaseToken.'_'.$verifiedData->endsAt->timestamp;

                                Payment::updateOrCreate(
                                    [
                                        'transaction_id' => $transactionId,
                                    ],
                                    [
                                        'user_id' => $sub->user_id,
                                        'subscription_id' => $sub->id,
                                        'plan_id' => $sub->plan_id,
                                        'amount' => $amount,
                                        'currency' => $sub->plan->currency ?? 'USD',
                                        'payment_method' => 'google',
                                        'status' => 'completed',
                                        'metadata' => [
                                            'notification_type' => $notificationType,
                                            'purchase_token' => $purchaseToken,
                                            'ends_at' => $verifiedData->endsAt->toIso8601String(),
                                        ],
                                    ]
                                );
                            }
                        } catch (Exception $e) {
                            Log::error('Google Webhook: Failed to verify purchase/record payment', ['error' => $e->getMessage()]);
                        }
                    }
                    // 3 = SUBSCRIPTION_CANCELED, 13 = EXPIRED
                    elseif (in_array($notificationType, [3, 13])) {
                        $sub->update(['status' => $notificationType == 3 ? 'cancelled' : 'expired']);
                    }
                    Log::info("Google Webhook Handled: Type {$notificationType} for Token {$purchaseToken}");
                } else {
                    Log::warning("Google Webhook: Subscription not found for Token {$purchaseToken}");
                }
            });

            return true;

        } catch (Exception $e) {
            Log::error('Google Webhook Processing Error: '.$e->getMessage());
            throw clone $e;
        }
    }
}
