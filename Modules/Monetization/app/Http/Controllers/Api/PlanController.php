<?php

namespace Modules\Monetization\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Modules\Monetization\Models\Plan;
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
}
