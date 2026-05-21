<?php

namespace App\Http\Requests\Api\Auth;

use App\Http\Requests\BaseRequest;

class ResetPasswordRequest extends BaseRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => 'required|email|exists:users,email',
            'reset_token' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ];
    }

    public function messages(): array
    {
        return [
            'password.confirmed' => 'The new password and confirm password do not match.',
            'otp.digits' => 'OTP must be valid.',
            'email.exists' => 'No user found with this email address.',
            'reset_token.required' => 'The reset token is required.',
        ];
    }
}
