<?php

namespace App\Http\Requests\Api\User;

use App\Http\Requests\BaseRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class UpdateSellerProfileRequest extends BaseRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = Auth::id();

        return [
            // User fields
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            // 'email' => [
            //     'nullable',
            //     'email',
            //     'max:255',
            //     Rule::unique('users', 'email')->ignore($userId),
            // ],
            // 'phone' => [
            //     'nullable',
            //     'numeric',
            //     'max_digits:20',
            //     Rule::unique('users', 'phone')->ignore($userId),
            // ],
            'secondary_email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('users', 'secondary_email')->ignore($userId),
            ],
            'username' => [
                'nullable',
                'string',
                'max:12',
                Rule::unique('users', 'username')->ignore($userId),
            ],
            'password' => 'nullable|string|min:8|max:300',
            'avatar' => 'nullable|image|max:10240',
            'cover_photo' => 'nullable|image|max:10240',

            // Business details
            'business_type' => 'nullable|string|in:Individual,Company',
            'company_name' => 'nullable|string|max:255',
            'tax_id_or_reg_number' => 'nullable|string|max:100',
            'industry_category' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'zip_code' => 'nullable|string|max:20',
            'address_line' => 'nullable|string',
            'nid_document_file' => 'nullable|file|max:10240',

            // Subscription/Payout fields
            'payout_method' => 'nullable|string|in:Bank_Transfer,Stripe',
            'stripe_account_id' => 'nullable|string|max:255',
            'account_holder_name' => 'nullable|string|max:255',
            'bank_name' => 'nullable|string|max:255',
            'account_number' => 'nullable|string|max:255',
            'swift_routing_code' => 'nullable|string|max:100',
            'payout_frequency' => 'nullable|string|in:Weekly,Monthly,On-demand',

            // Store fields
            'store_name' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('stores', 'store_name')->ignore(Auth::user()?->store?->id),
            ],
            'store_description' => 'nullable|string',
            'store_logo_file' => 'nullable|image|max:10240',
            'store_logo_file_2' => 'nullable|image|max:10240',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:50',
        ];
    }

    public function messages(): array
    {
        return [
            'avatar.image' => 'Avatar must be a valid image file.',
            'avatar.max' => 'Avatar size cannot exceed 10MB.',
            'cover_photo.image' => 'Cover photo must be a valid image file.',
            'cover_photo.max' => 'Cover photo size cannot exceed 10MB.',
            'phone.unique' => 'This phone number is already taken by another user.',
            'email.unique' => 'This email is already taken by another user.',
            'store_name.unique' => 'This store name is already taken.',
            'password.min' => 'Password must be at least 8 characters.',
        ];
    }
}
