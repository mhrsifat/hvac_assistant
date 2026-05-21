<?php

namespace App\Services\Api\Auth;

use App\Models\User;
use Exception;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class TokenService
{
    /**
     * Generate both access and refresh tokens for a user.
     */
    public function generateTokens(User $user): array
    {
        $accessTokenTtl = config('jwt.ttl', 15);
        $refreshTokenTtl = config('jwt.refresh_ttl', 20160);

        $accessToken = JWTAuth::claims([
            'type' => 'access',
            'exp' => now()->addMinutes($accessTokenTtl)->timestamp,
        ])->fromUser($user);

        $refreshToken = JWTAuth::claims([
            'type' => 'refresh',
            'exp' => now()->addMinutes($refreshTokenTtl)->timestamp,
        ])->fromUser($user);

        return [
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'expires_in' => $accessTokenTtl * 60,
        ];
    }

    /**
     * Refresh the access token using a refresh token.
     */
    public function refreshAccessToken(string $refreshToken): array
    {
        try {
            $payload = JWTAuth::setToken($refreshToken)->getPayload();

            if ($payload->get('type') !== 'refresh') {
                throw new Exception('Invalid token type. Expected a refresh token.');
            }

            $user = JWTAuth::setToken($refreshToken)->authenticate();

            if (! $user) {
                throw new Exception('User not found.');
            }

            $accessTokenTtl = config('jwt.ttl', 15);
            $refreshTokenTtl = config('jwt.refresh_ttl', 20160);

            $newAccessToken = JWTAuth::claims([
                'type' => 'access',
                'exp' => now()->addMinutes($accessTokenTtl)->timestamp,
            ])->fromUser($user);

            $newRefreshToken = JWTAuth::claims([
                'type' => 'refresh',
                'exp' => now()->addMinutes($refreshTokenTtl)->timestamp,
            ])->fromUser($user);

            JWTAuth::setToken($refreshToken)->invalidate();

            return [
                'access_token' => $newAccessToken,
                'refresh_token' => $newRefreshToken,
                'expires_in' => $accessTokenTtl * 60,
            ];
        } catch (Exception $e) {
            throw new Exception('Failed to refresh token: '.$e->getMessage());
        }
    }
}
