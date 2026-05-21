<?php

namespace App\Services\Api\Auth;

use App\Models\User;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

class SocialiteService
{
    private TokenService $tokenService;

    public function __construct(TokenService $tokenService)
    {
        $this->tokenService = $tokenService;
    }

    public function loginWithSocialite(string $provider, string $socialToken, string $role = 'user'): array
    {
        try {
            $socialUser = Socialite::driver($provider)->stateless()->userFromToken($socialToken);
        } catch (Exception $e) {
            Log::error(strtoupper($provider).' login error: '.$e->getMessage());
            throw new UnauthorizedHttpException('', 'Invalid token or provider');
        }

        if (! $socialUser || ! $socialUser->getEmail()) {
            throw new UnauthorizedHttpException('', 'Invalid social user data');
        }

        $user = User::where('email', $socialUser->getEmail())->first();
        $isNewUser = false;

        if (! $user) {
            $user = $this->createNewUser($socialUser, $role);
            $isNewUser = true;
        }

        $tokens = $this->tokenService->generateTokens($user);

        return [
            'status' => true,
            'message' => $isNewUser ? 'User registered successfully' : 'User logged in successfully',
            'code' => $isNewUser ? 201 : 200,
            'access_token' => $tokens['access_token'],
            'refresh_token' => $tokens['refresh_token'],
            'expires_in' => $tokens['expires_in'],
            'data' => $user,
        ];
    }

    /**
     * Create a new user with a unique username and assign a role
     */
    private function createNewUser(object $socialUser, string $role): User
    {
        $fullName = $socialUser->getName() ?? $socialUser->getNickname() ?? 'Unknown';

        // Split full name into first and last name for better data consistency
        $nameParts = explode(' ', $fullName, 2);
        $firstName = $nameParts[0];
        $lastName = $nameParts[1] ?? null;

        $username = strtolower(substr($firstName, 0, 6).(isset($lastName) ? substr($lastName, 0, 6) : ''));

        if (User::where('username', $username)->exists()) {
            $username .= rand(1000, 9999);
        }

        $user = User::create([
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $socialUser->getEmail(),
            'username' => $username,
            'password' => bcrypt(Str::random(16)),
            'email_verified_at' => now(),
            'terms_and_conditions' => true,
        ]);

        if (method_exists($user, 'assignRole')) {
            $user->assignRole($role);
        }

        return $user;
    }
}
