<?php

namespace Modules\Monetization\Services\Api;

use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Imdhemy\Purchases\Facades\Subscription as PurchasesSubscription;
use Modules\Monetization\DTOs\SubscriptionDataDTO;
use Throwable;

class GoogleSubscriptionService
{
    /**
     * Verify Google Play purchase and return DTO.
     */
    public function verifyPurchase(string $itemId, string $purchaseToken): ?SubscriptionDataDTO
    {
        try {
            $sub = PurchasesSubscription::googlePlay()->id($itemId)->token($purchaseToken)->get();

            return new SubscriptionDataDTO(
                providerSubscriptionId: $purchaseToken,
                productId: $itemId, // <-- Provided by Google Play
                startsAt: Carbon::createFromTimestampMs($sub->getStartTimeMillis()),
                endsAt: Carbon::createFromTimestampMs($sub->getExpiryTimeMillis()),
                trialEndsAt: null,
                providerMetadata: [
                    'kind' => $sub->getKind(),
                    'auto_renewing' => $sub->isAutoRenewing(),
                ]
            );
        } catch (Throwable $e) {
            Log::error('Google verification failed', ['error' => $e->getMessage()]);
            return null;
        }
    }
}
