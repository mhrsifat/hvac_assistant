<?php

namespace App\Services\Api\Auth;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class RegisterService
{
    private OTPService $otpService;

    private TokenService $tokenService;

    public function __construct(OTPService $otpService, TokenService $tokenService)
    {
        $this->otpService = $otpService;
        $this->tokenService = $tokenService;
    }

    public function register(array $data, bool $otpVerification = false): array
    {
        // Generate a unique username based on the first name and last name
        $firstNamePart = substr($data['first_name'], 0, 6);
        $lastNamePart = isset($data['last_name']) ? substr($data['last_name'], 0, 6) : '';
        $username = strtolower($firstNamePart.$lastNamePart);

        if (User::where('username', $username)->exists()) {
            $username .= rand(1000, 9999);
        }
        $data['username'] = $username;

        [$user, $otpToken] = DB::transaction(function () use ($data, $otpVerification) {
            $user = User::create([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'] ?? null,
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'phone' => $data['phone'] ?? null,
                'terms_and_conditions' => $data['terms_and_conditions'] ?? false,
                'username' => $data['username'],
            ]);

            if (method_exists($user, 'assignRole')) {
                $user->assignRole($data['role'] ?? 'user');
            }

            $otpToken = $otpVerification ? $this->otpService->createOtpForUser($user, 'registration') : null;

            return [$user, $otpToken];
        });

        if ($otpVerification) {
            return [
                'user' => $user,
                'otp_token' => $otpToken,
            ];
        }

        $tokens = $this->tokenService->generateTokens($user);

        return [
            'user' => $user,
            'access_token' => $tokens['access_token'],
            'refresh_token' => $tokens['refresh_token'],
            'expires_in' => $tokens['expires_in'],
        ];
    }
}
