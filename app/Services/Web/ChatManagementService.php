<?php

namespace App\Services\Web;

use App\Models\Chat;
use App\Models\HvacModel;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class ChatManagementService
{
    public function userOptions(): Collection
    {
        return User::query()
            ->select(['id', 'first_name', 'last_name', 'email'])
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();
    }

    public function hvacModelOptions(): Collection
    {
        return HvacModel::query()
            ->select(['id', 'name', 'brand_id'])
            ->with(['brand:id,name'])
            ->orderBy('name')
            ->get();
    }

    public function paginateForIndex(?string $search = null, ?string $status = null): LengthAwarePaginator
    {
        return Chat::query()
            ->with([
                'user:id,first_name,last_name,email',
                'hvacModel:id,name,brand_id',
                'hvacModel.brand:id,name',
            ])
            ->withCount('messages')
            ->when($status, function ($query, $statusValue): void {
                $query->where('status', $statusValue);
            })
            ->when($search, function ($query, $searchTerm): void {
                $query->where(function ($nestedQuery) use ($searchTerm): void {
                    $nestedQuery
                        ->where('title', 'like', "%{$searchTerm}%")
                        ->orWhereHas('user', function ($userQuery) use ($searchTerm): void {
                            $userQuery->where('first_name', 'like', "%{$searchTerm}%")
                                ->orWhere('last_name', 'like', "%{$searchTerm}%");
                        })
                        ->orWhereHas('hvacModel', function ($modelQuery) use ($searchTerm): void {
                            $modelQuery
                                ->where('name', 'like', "%{$searchTerm}%")
                                ->orWhere('model_number', 'like', "%{$searchTerm}%");
                        });
                });
            })
            ->latest('id')
            ->paginate(10)
            ->withQueryString();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Chat
    {
        return Chat::create($data);
    }

    public function updateStatus(Chat $chat, string $status): Chat
    {
        $chat->fill([
            'status' => $status,
        ])->save();

        return $chat;
    }

    public function delete(Chat $chat): void
    {
        $chat->delete();
    }
}
