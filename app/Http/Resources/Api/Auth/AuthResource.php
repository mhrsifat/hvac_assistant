<?php

namespace App\Http\Resources\Api\Auth;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuthResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'role' => method_exists($this->resource, 'getRoleNames')
                ? $this->getRoleNames()->first()
                : ($this->role ?? 'user'),
            'seller_status' => $this->when($this->hasRole('seller'), $this->seller_status),
            'seller_approved_at' => $this->when($this->hasRole('seller'), $this->seller_approved_at),
            'avatar' => $this->avatar ?? asset('no-photo-avatar.png'),
        ];
    }
}
