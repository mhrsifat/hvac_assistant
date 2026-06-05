<?php

namespace Modules\Monetization\Services\Web;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Monetization\Models\Plan;
use Modules\Monetization\Models\Subscription;

class SubscriptionService
{
    public function paginateForIndex(?string $search = null, ?string $status = null): LengthAwarePaginator
    {
        return Subscription::query()
            ->with([
                'user:id,first_name,last_name,email,avatar',
                'plan:id,name,slug,final_price,currency,billing_interval',
            ])
            ->when($search, function ($query, string $searchTerm): void {
                $query->where(function ($q) use ($searchTerm): void {
                    $q->whereHas('user', function ($userQuery) use ($searchTerm): void {
                        $userQuery->where('first_name', 'like', "%{$searchTerm}%")
                            ->orWhere('last_name', 'like', "%{$searchTerm}%")
                            ->orWhere('email', 'like', "%{$searchTerm}%");
                    })
                        ->orWhere('provider_subscription_id', 'like', "%{$searchTerm}%");
                });
            })
            ->when($status, function ($query, string $statusFilter): void {
                $query->where('status', $statusFilter);
            })
            ->latest('id')
            ->paginate(15)
            ->withQueryString();
    }

    /**
     * @return array<string, mixed>
     */
    public function getShowPageData(Subscription $subscription): array
    {
        $subscription->load([
            'user:id,first_name,last_name,email,avatar',
            'plan',
            'payments' => function ($query): void {
                $query->latest('id');
            },
            'payments.user:id,first_name,last_name,email',
        ]);

        return [
            'subscription' => $subscription,
        ];
    }

    public function cancel(Subscription $subscription): Subscription
    {
        $subscription->update([
            'status' => 'canceled',
            'cancelled_at' => now(),
        ]);

        return $subscription->fresh();
    }

    public function extend(Subscription $subscription, int $days): Subscription
    {
        $currentEnd = $subscription->ends_at ?? now();

        $updateData = [
            'ends_at' => Carbon::parse($currentEnd)->addDays($days),
        ];

        // Only reactivate if the subscription was canceled — preserve paused/trialing
        if ($subscription->status === 'canceled') {
            $updateData['status'] = 'active';
            $updateData['cancelled_at'] = null;
        }

        $subscription->update($updateData);

        return $subscription->fresh();
    }

    public function pause(Subscription $subscription): Subscription
    {
        $subscription->update([
            'status' => 'paused',
        ]);

        return $subscription->fresh();
    }

    public function reactivate(Subscription $subscription): Subscription
    {
        $subscription->update([
            'status' => 'active',
            'cancelled_at' => null,
        ]);

        return $subscription->fresh();
    }

    public function reduceDays(Subscription $subscription, int $days): Subscription
    {
        $currentEnd = $subscription->ends_at ?? now();

        $subscription->update([
            'ends_at' => Carbon::parse($currentEnd)->subDays($days),
        ]);

        return $subscription->fresh();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function createManual(User $user, Plan $plan, array $data): Subscription
    {
        return Subscription::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => $data['status'] ?? 'active',
            'payment_method' => $data['payment_method'] ?? 'manual',
            'starts_at' => $data['starts_at'] ?? now(),
            'ends_at' => $data['ends_at'] ?? now()->addMonth(),
            'trial_ends_at' => $data['trial_ends_at'] ?? null,
            'provider_subscription_id' => 'manual_'.now()->timestamp.'_'.uniqid(),
            'provider_metadata' => ['created_by' => 'admin', 'is_manual' => true],
        ]);
    }
}
