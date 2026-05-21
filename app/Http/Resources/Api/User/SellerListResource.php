<?php

namespace App\Http\Resources\Api\User;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SellerListResource extends JsonResource
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
            'role' => $this->getRoleNames()->first(),
            'active_status' => $this->status,
            'seller_status' => $this->seller_status,
            'seller_approved_at' => $this->seller_approved_at,
            'avatar' => $this->avatar ?? null,
            'business_info' => [
                'business_type' => $business?->business_type,
                'company_name' => $business?->company_name,
            ],
            'store_info' => [
                'store_name' => $store?->store_name,
                'store_description' => $store?->store_description,
                'store_logo_url' => $store?->store_logo_url,
                'store_logo_url_2' => $store?->store_logo_url_2,
                'contact_email' => $store?->contact_email,
                'contact_phone' => $store?->contact_phone,
            ],
        ];
    }
}
