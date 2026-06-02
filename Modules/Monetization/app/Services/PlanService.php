<?php

namespace Modules\Monetization\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Monetization\Models\Plan;
use Illuminate\Support\Str;

class PlanService
{
    public function paginateForIndex(?string $search = null): LengthAwarePaginator
    {
        return Plan::query()
            ->withCount(['subscriptions', 'payments'])
            ->when($search, function ($query, string $searchTerm): void {
                $query->where('name', 'like', "%{$searchTerm}%");
            })
            ->latest('id')
            ->paginate(10)
            ->withQueryString();
    }

    /**
     * Fetch comprehensive data for the dedicated Plan Show page.
     *
     * @return array<string, mixed>
     */
    public function getShowPageData(Plan $plan): array
    {
        $plan->loadCount(['subscriptions', 'payments']);

        // Eager load the users who bought this plan, paginated for performance
        $subscriptions = $plan->subscriptions()
            ->with(['user' => function ($query) {
                // Select only necessary fields to reduce payload size
                $query->select('id', 'first_name', 'last_name', 'email', 'avatar');
            }])
            ->latest('id')
            ->paginate(15);

        return [
            'plan' => $plan,
            'subscriptions' => $subscriptions,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Plan
    {
        return Plan::create($this->normalizeData($data));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Plan $plan, array $data): Plan
    {
        $plan->fill($this->normalizeData($data))->save();

        return $plan;
    }

    public function delete(Plan $plan): void
    {
        $plan->delete();
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalizeData(array $data): array
    {

        if (isset($data['name'])) {
            $data['slug'] = Str::slug($data['name']);
        }
        // Simplify features array: Keep only non-empty strings
        $features = $data['features'] ?? [];
        $data['features'] = collect($features)
            ->filter(fn($feature) => is_string($feature) && trim($feature) !== '')
            ->map(fn($feature) => trim($feature))
            ->values()
            ->all();

        // Clean up optional IDs (Nullify empty strings)
        foreach (['apple_product_id', 'google_product_id'] as $key) {
            if (array_key_exists($key, $data) && trim((string)$data[$key]) === '') {
                $data[$key] = null;
            }
        }

        // Normalize booleans, integers, and currency
        $data['currency'] = strtoupper(trim((string) ($data['currency'] ?? 'USD')));
        $data['trial_days'] = (int) ($data['trial_days'] ?? 0);
        $data['is_recommended'] = (bool) ($data['is_recommended'] ?? false);

        return $data;
    }
}
