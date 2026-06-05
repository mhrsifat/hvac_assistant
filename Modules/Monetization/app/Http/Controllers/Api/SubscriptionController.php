<?php

namespace Modules\Monetization\Http\Controllers\Api;

use App\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Modules\Monetization\DTOs\SubscriptionDataDTO;
use Modules\Monetization\Models\Plan;
use Modules\Monetization\Models\Subscription;
use Modules\Monetization\Services\Api\AppleSubscriptionService;
use Modules\Monetization\Services\Api\GoogleSubscriptionService;
use Modules\Monetization\Services\Api\SubscriptionManagerService;

class SubscriptionController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AppleSubscriptionService $appleService,
        protected GoogleSubscriptionService $googleService,
        protected SubscriptionManagerService $subscriptionManager
    ) {}

    /**
     * Verify an Apple App Store receipt.
     */
    public function verifyApple(Request $request): JsonResponse
    {
        // Removed plan_slug. The frontend only needs to send the receipt.
        $request->validate([
            'receipt_data' => 'required|string',
        ]);

        try {
            $verifiedData = $this->appleService->verifyReceipt($request->receipt_data);

            if (! $verifiedData) {
                return $this->error(400, 'Invalid Apple receipt');
            }

            // Securely resolve the Plan using the Product ID from Apple's servers
            $plan = Plan::where('apple_product_id', $verifiedData->productId)->first();

            if (! $plan) {
                return $this->error(404, 'Plan not found for this product');
            }

            $subscription = $this->subscriptionManager->activateSubscription(
                $request->user(),
                $plan,
                'apple',
                $verifiedData
            );

            return $this->success(200, 'Apple subscription activated successfully.', $subscription);
        } catch (Exception $e) {
            Log::error('Apple Verification Error: '.$e->getMessage());

            return $this->error(500, 'Server error during Apple verification');
        }
    }

    /**
     * Verify a Google Play purchase token.
     */
    public function verifyGoogle(Request $request): JsonResponse
    {
        // Removed plan_slug.
        $request->validate([
            'item_id' => 'required|string',
            'purchase_token' => 'required|string',
        ]);

        try {
            $verifiedData = $this->googleService->verifyPurchase($request->item_id, $request->purchase_token);

            if (! $verifiedData) {
                return $this->error(400, 'Invalid Google purchase token');
            }

            // Securely resolve the Plan using the Product ID from Google's servers
            $plan = Plan::where('google_product_id', $verifiedData->productId)->first();

            if (! $plan) {
                return $this->error(404, 'Plan not found for this product');
            }

            $subscription = $this->subscriptionManager->activateSubscription(
                $request->user(),
                $plan,
                'google',
                $verifiedData
            );

            return $this->success(200, 'Google subscription activated successfully.', $subscription);
        } catch (Exception $e) {
            Log::error('Google Verification Error: '.$e->getMessage());

            return response()->json(['success' => false, 'message' => 'Server error during Google verification'], 500);
        }
    }

    /**
     * Cancel the user's active subscription (local state change).
     */
    public function cancel(Request $request): JsonResponse
    {
        try {
            $subscription = Subscription::where('user_id', $request->user()->id)
                ->where('status', 'active')
                ->first();

            if (! $subscription) {
                return $this->error(404, 'No active subscription found');
            }

            $subscription->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
            ]);

            return $this->success(200, 'Subscription marked as cancelled.', $subscription);
        } catch (Exception $e) {
            Log::error('Cancel Subscription Error: '.$e->getMessage());

            return $this->error(500, 'An error occurred while cancelling subscription');
        }
    }

    /**
     * Demo route to simulate a subscription for testing.
     */
    public function simulate(Request $request): JsonResponse
    {
        // Simulate still requires plan_slug because there is no real receipt to extract a product_id from
        $request->validate([
            'plan_slug' => 'required|string|exists:plans,slug',
            'has_trial' => 'boolean',
        ]);

        try {
            $plan = Plan::where('slug', $request->plan_slug)->firstOrFail();

            $hasTrial = $request->boolean('has_trial', true);
            $now = Carbon::now();
            $trialEnd = $hasTrial ? $now->copy()->addDays(7) : null;
            $endsAt = $hasTrial ? $trialEnd : $now->copy()->addMonth();

            $mockVerifiedData = new SubscriptionDataDTO(
                providerSubscriptionId: 'demo_sub_'.uniqid(),
                productId: $plan->apple_product_id ?? 'demo_product',
                startsAt: $now,
                endsAt: $endsAt,
                trialEndsAt: $trialEnd,
                providerMetadata: ['is_simulation' => true]
            );

            $subscription = $this->subscriptionManager->activateSubscription(
                $request->user(),
                $plan,
                'demo',
                $mockVerifiedData
            );

            return $this->success(200, 'Demo subscription created successfully', $subscription);
        } catch (Exception $e) {
            Log::error('Simulate Subscription Error: '.$e->getMessage());

            return $this->error(500, 'Server error during simulation');
        }
    }
}
