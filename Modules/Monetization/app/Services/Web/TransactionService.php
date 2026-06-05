<?php

namespace Modules\Monetization\Services\Web;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Monetization\Models\Payment;
use Modules\Monetization\Models\Plan;

class TransactionService
{
    public function paginateForIndex(?string $search = null, ?string $status = null): LengthAwarePaginator
    {
        return Payment::query()
            ->with([
                'user:id,first_name,last_name,email,avatar',
                'plan:id,name,slug,final_price,currency',
                'subscription:id,status,provider_subscription_id',
            ])
            ->when($search, function ($query, string $searchTerm): void {
                $query->where(function ($q) use ($searchTerm): void {
                    $q->where('transaction_id', 'like', "%{$searchTerm}%")
                        ->orWhereHas('user', function ($userQuery) use ($searchTerm): void {
                            $userQuery->where('first_name', 'like', "%{$searchTerm}%")
                                ->orWhere('last_name', 'like', "%{$searchTerm}%")
                                ->orWhere('email', 'like', "%{$searchTerm}%");
                        });
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
    public function getShowPageData(Payment $payment): array
    {
        $payment->load([
            'user:id,first_name,last_name,email,avatar',
            'plan',
            'subscription',
            'subscription.user:id,first_name,last_name,email',
        ]);

        return [
            'transaction' => $payment,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function createManual(User $user, Plan $plan, array $data): Payment
    {
        return Payment::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'subscription_id' => $data['subscription_id'] ?? null,
            'amount' => $data['amount'],
            'currency' => $data['currency'] ?? 'USD',
            'payment_method' => $data['payment_method'] ?? 'manual',
            'transaction_id' => 'manual_'.now()->timestamp.'_'.uniqid(),
            'status' => $data['status'] ?? 'completed',
            'metadata' => ['created_by' => 'admin', 'is_manual' => true],
        ]);
    }
}
