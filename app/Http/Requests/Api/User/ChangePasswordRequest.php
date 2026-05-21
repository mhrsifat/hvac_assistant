<?php

namespace App\Http\Requests\Api\User;

use App\Http\Requests\BaseRequest;
use Illuminate\Validation\Rules\Password;

class ChangePasswordRequest extends BaseRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $user = auth()->user();

        $passwordRule = ['required', 'string', 'min:8', 'confirmed', 'different:current_password'];

        if ($user && $user->hasAnyRole(['admin', 'seller', 'super-admin'])) {
            $passwordRule = [
                'required',
                'string',
                'confirmed',
                'different:current_password',
                Password::min(8)->mixedCase()->numbers()->symbols(),
            ];
        }

        return [
            'current_password' => 'required|string',
            'new_password' => $passwordRule,
        ];
    }

    public function messages(): array
    {
        return [
            'current_password.required' => 'Please enter your current password.',
            'new_password.confirmed' => 'New password confirmation does not match.',
            'new_password.different' => 'New password must be different from the current one.',
        ];
    }
}
