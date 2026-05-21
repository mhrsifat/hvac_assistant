<?php

namespace App\Http\Resources\Api\User;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SellerResource extends JsonResource
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
            'avatar' => $this->avatar ?? null,
            'business_info' => [
                'business_type' => $business?->business_type,
                'company_name' => $business?->company_name,
                'tax_id_or_reg_number' => $business?->tax_id_or_reg_number,
                'industry_category' => $business?->industry_category,
                'country' => $business?->country,
                'state' => $business?->state,
                'city' => $business?->city,
                'zip_code' => $business?->zip_code,
                'address_line' => $business?->address_line,
                'nid_document_url' => $business?->nid_document_url,
            ],
            'payout_info' => [
                'payout_method' => $subscription?->payout_method,
                'account_holder_name' => $subscription?->account_holder_name,
                'bank_name' => $subscription?->bank_name,
                'account_number' => $subscription?->account_number,
                'swift_routing_code' => $subscription?->swift_routing_code,
                'payout_frequency' => $subscription?->payout_frequency,
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
