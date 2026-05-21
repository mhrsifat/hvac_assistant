<?php

namespace App\Http\Controllers\Api\Auth;

use App\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Auth\ChangePasswordRequest;
use App\Http\Requests\Api\Auth\ForgotPasswordRequest;
use App\Http\Requests\Api\Auth\LoginRequest;
use App\Http\Requests\Api\Auth\RegisterRequest;
use App\Http\Requests\Api\Auth\ResendOTPRequest;
use App\Http\Requests\Api\Auth\ResetPasswordRequest;
use App\Http\Requests\Api\Auth\SocialiteLoginRequest;
use App\Http\Requests\Api\Auth\VerifyOtpRequest;
use App\Http\Resources\Api\User\UserResource;
use App\Models\User;
use App\Services\Api\Auth\ChangePasswordService;
use App\Services\Api\Auth\LoginService;
use App\Services\Api\Auth\OTPService;
use App\Services\Api\Auth\RegisterService;
use App\Services\Api\Auth\SocialiteService;
use App\Services\Api\Auth\TokenService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    use ApiResponse;

    private RegisterService $registerService;

    private LoginService $loginService;

    private OTPService $otpService;

    private SocialiteService $socialiteService;

    private ChangePasswordService $changePasswordService;

    private TokenService $tokenService;

    public function __construct(
        RegisterService $registerService,
        LoginService $loginService,
        OTPService $otpService,
        SocialiteService $socialiteService,
        ChangePasswordService $changePasswordService,
        TokenService $tokenService
    ) {
        $this->registerService = $registerService;
        $this->loginService = $loginService;
        $this->otpService = $otpService;
        $this->socialiteService = $socialiteService;
        $this->changePasswordService = $changePasswordService;
        $this->tokenService = $tokenService;
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();
            $otpVerification = config('auth.verification.enabled', true);

            $result = $this->registerService->register($data, $otpVerification);

            $returnData = [
                'user' => new UserResource($result['user']),
            ];

            if ($otpVerification) {
                $returnData['otp_token'] = $result['otp_token'];
            } else {
                $returnData['access_token'] = $result['access_token'];
                $returnData['refresh_token'] = $result['refresh_token'];
                $returnData['expires_in'] = $result['expires_in'];
            }

            return $this->success(201, 'User registered successfully.', $returnData);
        } catch (Exception $e) {
            return $this->error(500, $e->getMessage());
        }
    }

    public function refresh(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'refresh_token' => 'required|string',
            ]);

            $result = $this->tokenService->refreshAccessToken($request->refresh_token);

            return $this->success(200, 'Access token refreshed successfully.', $result);
        } catch (Exception $e) {
            return $this->error(401, $e->getMessage());
        }
    }

    public function verifyOtp(VerifyOtpRequest $request): JsonResponse
    {
        try {
            $result = $this->otpService->verifyOtp(
                $request->email,
                $request->otp_token,
                $request->otp,
                $request->type
            );

            if ($request->type === 'registration') {
                $tokens = $this->tokenService->generateTokens($result);

                return $this->success(200, 'Email verified successfully.', [
                    'user' => new UserResource($result),
                    'access_token' => $tokens['access_token'],
                    'refresh_token' => $tokens['refresh_token'],
                    'expires_in' => $tokens['expires_in'],
                ]);
            }

            if ($request->type === 'password_reset') {
                return $this->success(200, 'OTP verified successfully.', [
                    'reset_token' => $result,
                ]);
            }

            return $this->error(400, 'Invalid verification type.');
        } catch (Exception $e) {
            return $this->error(422, $e->getMessage());
        }
    }

    public function resendOtp(ResendOTPRequest $request): JsonResponse
    {
        try {
            $user = User::where('email', $request->email)->firstOrFail();
            $otpToken = $this->otpService->resendOtp($user, $request->type);

            return $this->success(200, 'OTP resent successfully.', ['otp_token' => $otpToken]);
        } catch (Exception $e) {
            return $this->error(500, $e->getMessage());
        }
    }

    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $result = $this->loginService->login($request->validated());

            return $this->success(200, 'Login successful.', [
                'user' => new UserResource($result['user']),
                'access_token' => $result['access_token'],
                'refresh_token' => $result['refresh_token'],
                'expires_in' => $result['expires_in'],
            ]);
        } catch (Exception $e) {
            return $this->error(401, $e->getMessage());
        }
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        try {
            $user = User::where('email', $request->email)->firstOrFail();
            $otpToken = $this->otpService->createOtpForUser($user, 'password_reset');

            return $this->success(200, 'OTP sent for password reset.', ['otp_token' => $otpToken]);
        } catch (Exception $e) {
            return $this->error(500, $e->getMessage());
        }
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        try {
            $user = auth('api')->user();

            $this->changePasswordService->changePassword(
                $user,
                $request->validated()
            );

            return $this->success(200, 'Password changed successfully.');
        } catch (Exception $e) {
            return $this->error(422, $e->getMessage());
        }
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        try {
            $user = User::where('email', $request->email)->firstOrFail();
            $resetToken = cache()->get('password_reset_token_'.$user->id);

            if (! $resetToken || ! hash_equals($resetToken, $request->reset_token)) {
                throw new Exception('Invalid reset token.');
            }

            $user->password = bcrypt($request->password);
            $user->save();

            cache()->forget('password_reset_token_'.$user->id);

            return $this->success(200, 'Password reset successfully.');
        } catch (Exception $e) {
            return $this->error(422, $e->getMessage());
        }
    }

    public function logout(): JsonResponse
    {
        Auth::guard('api')->logout();

        return $this->success(200, 'User logged out successfully.');
    }

    public function socialiteLogin(SocialiteLoginRequest $request): JsonResponse
    {
        try {
            $role = $request->input('role', 'user');
            $result = $this->socialiteService->loginWithSocialite(
                $request->provider,
                $request->token,
                $role
            );

            return $this->success($result['code'], $result['message'], [
                'user' => new UserResource($result['data']),
                'access_token' => $result['access_token'] ?? $result['token'],
                'refresh_token' => $result['refresh_token'] ?? null,
            ]);
        } catch (Exception $e) {
            return $this->error(401, $e->getMessage());
        }
    }
}
