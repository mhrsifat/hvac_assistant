<?php

namespace App\Http\Requests\Api\Auth;

use App\Http\Requests\BaseRequest;

class SocialiteLoginRequest extends BaseRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'provider' => 'required|string|in:google,facebook,apple',
            'token' => 'required|string',
            'role' => 'nullable|string|in:user,seller,admin',
        ];
    }

    public function messages(): array
    {
        return [
            'provider.required' => 'The provider field is required.',
            'provider.in' => 'The provider must be one of: google, facebook, apple.',
            'token.required' => 'The token field is required.',
            'role.in' => 'The role must be either user or admin.',
        ];
    }
}
