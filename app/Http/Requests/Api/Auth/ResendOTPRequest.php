<?php

namespace App\Http\Requests\Api\Auth;

use App\Http\Requests\BaseRequest;

class ResendOTPRequest extends BaseRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => 'required|email|exists:users,email',
            'type' => 'required|string|in:registration,password_reset',
        ];
    }

    public function messages(): array
    {
        return [
            'email.exists' => 'We could not find any account with this email address.',
        ];
    }
}
