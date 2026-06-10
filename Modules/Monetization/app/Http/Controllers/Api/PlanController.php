<?php

namespace Modules\Monetization\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Monetization\Models\Plan;
use Modules\Monetization\Models\Subscription;
use Modules\Monetization\Services\Api\PlanService;

class PlanController extends Controller
{
    public function __construct(private PlanService $planService) {}

    public function index(): JsonResponse
    {
        $plans = $this->planService->index();

        $returnData = [
            'plans' => collect($plans->items())
                ->map(function (Plan $plan) {
                    return [
                        'name' => $plan->name,
                        'slug' => $plan->slug,
                        'price' => (string) $plan->final_price,
                        'currency' => $plan->currency,
                        'apple_product_id' => $plan->apple_product_id,
                        'google_product_id' => $plan->google_product_id,
                        'features' => $plan->features,
                        'billing_interval' => $plan->billing_interval,
                        'trial_days' => (int) $plan->trial_days,
                        'is_recommended' => (bool) $plan->is_recommended,
                    ];
                })
                ->values(),
        ];

        return $this->success(
            200,
            'Plans retrieved successfully.',
            $returnData
        );
    }

    public function getCurrentUserPlan(Request $request): JsonResponse
    {
        $subscription = Subscription::query()
            ->with('plan')
            ->where('user_id', $request->user()->id)
            ->whereIn('status', ['active', 'trialing'])
            ->latest('id')
            ->first();

        $returnData = [
            'subscription' => $subscription ? [
                // 'id' => $subscription->id,
                'status' => $subscription->status,
                'starts_at' => $subscription->starts_at,
                'ends_at' => $subscription->ends_at,
                'trial_ends_at' => $subscription->trial_ends_at,
                'cancelled_at' => $subscription->cancelled_at,

                'plan' => $subscription?->plan ? [
                    'name' => $subscription->plan->name,
                    'slug' => $subscription->plan->slug,
                    'price' => (string) $subscription->plan->final_price,
                    'currency' => $subscription->plan->currency,
                    'apple_product_id' => $subscription->plan->apple_product_id,
                    'google_product_id' => $subscription->plan->google_product_id,
                    'features' => $subscription->plan->features,
                    'billing_interval' => $subscription->plan->billing_interval,
                    'trial_days' => (int) $subscription->plan->trial_days,
                    'is_recommended' => (bool) $subscription->plan->is_recommended,
                ] : null,
            ] : null,

        ];

        return $this->success(200, 'Current user plan retrieved successfully.', $returnData);
    }
}
