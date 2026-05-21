<?php

namespace App\Http\Resources\Api\User;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
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
            'secondary_email' => $this->secondary_email,
            'username' => $this->username,
            'phone' => $this->phone,
            'country_name' => $this->country_name,
            'state' => $this->state,
            'zip_code' => $this->zip_code,
            'role' => $this->getRoleNames()->first(),
            'seller_status' => $this->when($this->hasRole('seller'), $this->seller_status),
            'seller_approved_at' => $this->when($this->hasRole('seller'), $this->seller_approved_at),
            'avatar' => $this->avatar ?? null,
        ];
    }
}
