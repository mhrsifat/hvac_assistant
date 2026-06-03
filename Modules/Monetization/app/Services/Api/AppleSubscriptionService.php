<?php

namespace Modules\Monetization\Services\Api;

use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Imdhemy\Purchases\Facades\Subscription as PurchasesSubscription;
use Modules\Monetization\DTOs\SubscriptionDataDTO;
use Throwable;

class AppleSubscriptionService
{
    /**
     * Verify Apple receipt and return DTO.
     */
    public function verifyReceipt(string $receiptData): ?SubscriptionDataDTO
    {
        try {
            $response = PurchasesSubscription::appStore()
                ->receiptData($receiptData)
                ->verifyRenewable();

            if (!$response->getStatus()->isValid()) {
                return null;
            }

            $latestReceipts = $response->getLatestReceiptInfo();

            if (empty($latestReceipts)) {
                return null;
            }

            usort($latestReceipts, function ($a, $b) {
                return $b->getExpiresDateMs() <=> $a->getExpiresDateMs();
            });

            $latest = $latestReceipts[0];

            return new SubscriptionDataDTO(
                providerSubscriptionId: $latest->getOriginalTransactionId(),
                productId: $latest->getProductId(), // <-- Extracted straight from Apple
                startsAt: Carbon::createFromTimestampMs($latest->getPurchaseDateMs()),
                endsAt: Carbon::createFromTimestampMs($latest->getExpiresDateMs()),
                trialEndsAt: $latest->getIsTrialPeriod() === 'true'
                    ? Carbon::createFromTimestampMs($latest->getExpiresDateMs())
                    : null,
                providerMetadata: [
                    'transaction_id' => $latest->getTransactionId(),
                ]
            );
        } catch (Throwable $e) {
            Log::error('Apple verification failed', ['error' => $e->getMessage()]);
            return null;
        }
    }
}
