<?php

namespace App\Services\Api\Auth;

use App\Models\User;
use Exception;
use Illuminate\Support\Facades\Auth;

class LoginService
{
    private TokenService $tokenService;

    public function __construct(TokenService $tokenService)
    {
        $this->tokenService = $tokenService;
    }

    public function login(array $data): array
    {
        // Use validate() instead of attempt() to avoid generating an unused token
        if (! Auth::guard('api')->validate(['email' => $data['email'], 'password' => $data['password']])) {
            throw new Exception('Invalid email or password.');
        }

        $user = User::where('email', $data['email'])->first();

        // Prevent unverified users from logging in
        if (config('auth.verification.enabled') && is_null($user->email_verified_at)) {
            throw new Exception('Please verify your email address before logging in.');
        }

        $tokens = $this->tokenService->generateTokens($user);

        // if user role is admin / staff/ super_admin, log the login activity
        if ($user->hasAnyRole(['admin', 'staff', 'super_admin'])) {
            $user->activities()->create([
                'activity_type' => 'login',
                'details' => 'User logged in',
            ]);
        }

        return [
            'user' => $user,
            'access_token' => $tokens['access_token'],
            'refresh_token' => $tokens['refresh_token'],
            'expires_in' => $tokens['expires_in'],
        ];
    }
}
