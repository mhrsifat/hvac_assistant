<?php

namespace App\Http\Requests\Api\User;

use App\Http\Requests\BaseRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends BaseRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = Auth::id();

        return [
            'first_name' => 'nullable|string|max:100',
            'last_name' => 'nullable|string|max:100',
            'avatar' => 'nullable|image|max:10240',

            // 'phone' => [
            //     'nullable',
            //     'numeric',
            //     'max_digits:20',
            //     Rule::unique('users', 'phone')->ignore($userId),
            // ],

            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],

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

            'country_name' => 'nullable|string|max:255',
            'state' => 'nullable|string|max:255',
            'zip_code' => 'nullable|string|max:20',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Your profile name cannot be empty.',
            'avatar.image' => 'Avatar must be a valid image file.',
            'avatar.max' => 'Avatar size cannot exceed 10MB.',
            'phone.unique' => 'This phone number is already taken by another user.',
        ];
    }
}
