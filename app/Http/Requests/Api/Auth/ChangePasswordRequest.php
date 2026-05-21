<?php

namespace App\Http\Requests\Api\Auth;

use App\Http\Requests\BaseRequest;

class ChangePasswordRequest extends BaseRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'old_password' => 'required|string',
            'new_password' => 'required|string|confirmed',
        ];
    }

    public function messages(): array
    {
        return [
            'new_password.confirmed' => 'The new password and confirm password do not match.',
            'old_password.required' => 'The old password is required.',
            'new_password.required' => 'The new password is required.',
        ];
    }
}
