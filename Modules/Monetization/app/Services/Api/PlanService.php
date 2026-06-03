<?php

namespace Modules\Monetization\Services\Api;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Monetization\Models\Plan;

class PlanService
{
    public function index(?string $search = null): LengthAwarePaginator
    {
        return Plan::active()
            ->when($search, function ($query, string $searchTerm): void {
                $query->where('name', 'like', "%{$searchTerm}%");
            })
            ->latest('id')
            ->paginate(10)
            ->withQueryString();
    }
}
