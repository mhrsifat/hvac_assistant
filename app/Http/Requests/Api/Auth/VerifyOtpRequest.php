<?php

namespace App\Http\Requests\Api\Auth;

use App\Http\Requests\BaseRequest;

class VerifyOtpRequest extends BaseRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => 'required|email|exists:users,email',
            'otp_token' => 'required|string',
            'otp' => 'required|digits:'.config('auth.otp_length', 4),
            'type' => 'required|string|in:registration,password_reset',
        ];
    }

    public function messages(): array
    {
        return [
            'email.exists' => 'Invalid user email.',
            'otp.required' => 'Please enter the OTP sent to your email.',
            'otp.digits' => 'OTP must be exactly '.config('auth.otp_length', 4).' digits.',
        ];
    }
}
