<?php

namespace App\Services\Web;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UserService
{
    public function paginateForIndex(?string $search = null, ?string $status = null): LengthAwarePaginator
    {
        return User::query()
            ->withCount(['subscriptions', 'payments'])
            ->whereDoesntHave('roles', function ($query): void {
                $query->whereIn('name', ['admin', 'super-admin']);
            })
            ->when($search, function ($query, string $searchTerm): void {
                $query->where(function ($q) use ($searchTerm): void {
                    $q->where('first_name', 'like', "%{$searchTerm}%")
                        ->orWhere('last_name', 'like', "%{$searchTerm}%")
                        ->orWhere('email', 'like', "%{$searchTerm}%")
                        ->orWhere('username', 'like', "%{$searchTerm}%");
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
    public function getShowPageData(User $user): array
    {
        $user->loadCount(['subscriptions', 'payments']);

        $subscriptions = $user->subscriptions()
            ->with('plan:id,name,slug,final_price,currency,billing_interval')
            ->latest('id')
            ->get();

        $payments = $user->payments()
            ->with([
                'plan:id,name,slug',
                'subscription:id,status,provider_subscription_id',
            ])
            ->latest('id')
            ->paginate(10, ['*'], 'payments_page')
            ->withQueryString();

        return [
            'user' => $user,
            'subscriptions' => $subscriptions,
            'payments' => $payments,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(User $user, array $data): User
    {
        $updateData = [];

        if (isset($data['first_name'])) {
            $updateData['first_name'] = $data['first_name'];
        }

        if (isset($data['last_name'])) {
            $updateData['last_name'] = $data['last_name'];
        }

        if (isset($data['email'])) {
            $updateData['email'] = $data['email'];
        }

        if (isset($data['status'])) {
            $updateData['status'] = $data['status'];
        }

        if (! empty($data['password'])) {
            $updateData['password'] = Hash::make($data['password']);
        }

        // Handle verification toggle
        if (isset($data['is_verified'])) {
            $updateData['email_verified_at'] = $data['is_verified'] ? now() : null;
        }

        // Handle avatar upload
        if (isset($data['avatar']) && $data['avatar'] !== null) {
            // Delete old avatar
            if ($user->getRawOriginal('avatar')) {
                Storage::disk('public')->delete($user->getRawOriginal('avatar'));
            }

            $updateData['avatar'] = $data['avatar']->store('avatars', 'public');
        }

        if (isset($data['remove_avatar']) && $data['remove_avatar']) {
            if ($user->getRawOriginal('avatar')) {
                Storage::disk('public')->delete($user->getRawOriginal('avatar'));
            }

            $updateData['avatar'] = null;
        }

        $user->update($updateData);

        return $user->fresh();
    }

    /**
     * Soft delete (deactivate) user.
     */
    public function softDelete(User $user): void
    {
        $user->update(['status' => 'deleted']);
    }

    /**
     * Permanently delete user and their data.
     */
    public function forceDelete(User $user): void
    {
        // Delete avatar
        if ($user->getRawOriginal('avatar')) {
            Storage::disk('public')->delete($user->getRawOriginal('avatar'));
        }

        $user->delete();
    }
}
