<?php

namespace App\Http\Requests\Api\Auth;

use App\Http\Requests\BaseRequest;

class LoginRequest extends BaseRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => 'required|string|email|max:100',
            'password' => 'required|string|min:8',
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'Please provide your registered email.',
            'email.email' => 'Please provide a valid email format.',
            'password.required' => 'Password is required to login.',
            'password.min' => 'Password must be at least 8 characters long.',
        ];
    }
}
