<?php

namespace Modules\Monetization\Services\Api;

use Exception;
use Illuminate\Support\Facades\Log;
use Modules\Monetization\DTOs\SubscriptionDataDTO;
use Modules\Monetization\Models\Plan;
use Modules\Monetization\Models\Subscription;

class SubscriptionManagerService
{
    /**
     * Process and activate the verified subscription in the database.
     */
    public function activateSubscription(object $user, Plan $plan, string $paymentMethod, SubscriptionDataDTO $dto): Subscription
    {
        try {
            return Subscription::updateOrCreate(
                [
                    'provider_subscription_id' => $dto->providerSubscriptionId,
                ],
                [
                    'user_id' => $user->id,
                    'plan_id' => $plan->id,
                    'status' => 'active',
                    'starts_at' => $dto->startsAt,
                    'ends_at' => $dto->endsAt,
                    'trial_ends_at' => $dto->trialEndsAt,
                    'payment_method' => $paymentMethod,
                    'provider_metadata' => $dto->providerMetadata,
                ]
            );
        } catch (Exception $e) {
            Log::error('Failed to activate subscription', ['error' => $e->getMessage()]);
            throw clone $e;
        }
    }
}