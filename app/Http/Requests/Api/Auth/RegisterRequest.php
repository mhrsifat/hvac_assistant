<?php

namespace App\Http\Requests\Api\Auth;

use App\Http\Requests\BaseRequest;

class RegisterRequest extends BaseRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => 'required|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|max:300|confirmed',
            'phone' => 'nullable|string|min:5|max:20|unique:users,phone',
            'terms_and_conditions' => 'nullable|boolean',
            'role' => 'nullable|string|in:user,seller,admin',
        ];
    }

    public function messages(): array
    {
        return [
            'first_name.required' => 'First name is required to create an account.',
            'email.required' => 'We need your email address to register.',
            'email.unique' => 'This email is already registered. Please login.',
            'password.confirmed' => 'The password confirmation does not match.',
            'phone.unique' => 'This phone number is already associated with an account.',
            'role.in' => 'The selected role is invalid.',
        ];
    }
}
