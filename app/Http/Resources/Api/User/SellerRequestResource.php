<?php

namespace App\Http\Resources\Api\User;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SellerRequestResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        $business = $this->businessDetail;
        $subscription = $this->subscriptionAndPayment;
        $store = $this->store;

        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'role' => $this->getRoleNames()->first(),
            'seller_status' => $this->seller_status,
            'seller_approved_at' => $this->seller_approved_at,
            'business_info' => [
                'business_type' => $business?->business_type,
            ],
            'store_info' => [
                'contact_email' => $store?->contact_email,
                'contact_phone' => $store?->contact_phone,
            ],
            'timestamps' => [
                'created_at' => $this->created_at?->toDateTimeString(),
                'updated_at' => $this->updated_at?->toDateTimeString(),
            ],
        ];
    }
}
