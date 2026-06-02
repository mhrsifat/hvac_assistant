<?php

namespace Modules\Monetization\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Monetization\Models\Plan;
use Modules\Monetization\Services\PlanService;

class PlanController extends Controller
{
    public function __construct(
        private PlanService $planService,
    ) {}

    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));

        return Inertia::render('plans/index', [
            'filters' => [
                'search' => $search,
            ],
            'plans' => Inertia::defer(fn() => $this->planService->paginateForIndex(
                search: $search !== '' ? $search : null,
            )),
        ]);
    }

    /**
     * Render the dedicated show page with plan details and subscribers.
     */
    public function show(Plan $plan): Response
    {
        $data = $this->planService->getShowPageData($plan);

        return Inertia::render('plans/show', [
            'plan' => $data['plan'],
            'subscriptions' => $data['subscriptions'],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->planService->create($this->validatePlanData($request));

        return back()->with('success', 'Plan created successfully.');
    }

    public function update(Request $request, Plan $plan): RedirectResponse
    {
        $this->planService->update($plan, $this->validatePlanData($request));

        return back()->with('success', 'Plan updated successfully.');
    }

    public function destroy(Plan $plan): RedirectResponse
    {
        $this->planService->delete($plan);

        return back()->with('success', 'Plan deleted successfully.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validatePlanData(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'final_price' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:3'],
            'apple_product_id' => ['nullable', 'string', 'max:255'],
            'google_product_id' => ['nullable', 'string', 'max:255'],
            
            'features' => ['nullable', 'array'],
            'features.*' => ['required', 'string', 'max:255'],
            
            'billing_interval' => ['required', 'in:daily,weekly,monthly,yearly,lifetime'],
            'trial_days' => ['nullable', 'integer', 'min:0'],
            'is_recommended' => ['nullable', 'boolean'],
            'status' => ['required', 'in:active,inactive'],
        ]);
    }
}
