<?php

namespace App\Services\Api\Auth;

use App\Mail\OTPMail;
use App\Models\User;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class OTPService
{
    public function createOtpForUser(User $user, string $type): string
    {
        $otpLength = config('auth.otp_length', 4);
        $otpExpiry = config('auth.otp_expires_in', 5);

        // Security Update: Random OTP in production, static in local
        if (app()->environment('production')) {
            $otp = str_pad((string) random_int(0, pow(10, $otpLength) - 1), $otpLength, '0', STR_PAD_LEFT);
        } else {
            $otp = str_repeat('1', $otpLength); // e.g., '1111'
            $otp = 1234;
        }

        $otpToken = bin2hex(random_bytes(32));

        DB::table('otps')->insert([
            'user_id' => $user->id,
            'otp' => $otp,
            'type' => $type,
            'token' => $otpToken,
            'expires_at' => now()->addMinutes($otpExpiry),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        try {
            Mail::to($user->email)->send(new OTPMail($otp));
        } catch (\Throwable $e) {
            Log::error("Failed to send OTP mail for user {$user->id}: {$e->getMessage()}");
        }

        return $otpToken;
    }

    public function verifyOtp(string $email, string $otpToken, string $otp, string $type): User|string
    {
        $user = User::where('email', $email)->firstOrFail();

        $otpRecord = DB::table('otps')
            ->where('user_id', $user->id)
            ->where('token', $otpToken)
            ->where('used', false)
            ->where('type', $type)
            ->first();

        if (! $otpRecord || ! hash_equals($otpRecord->otp, $otp)) {
            throw new Exception('Invalid OTP token or code.');
        }

        if (Carbon::parse($otpRecord->expires_at)->isPast()) {
            throw new Exception('OTP has expired.');
        }

        DB::table('otps')
            ->where('id', $otpRecord->id)
            ->update(['used' => true]);

        if ($type === 'registration') {

            if (is_null($user->email_verified_at)) {
                $user->email_verified_at = now();
                $user->save();
            }

            return $user;
        }

        if ($type === 'password_reset') {

            $resetToken = bin2hex(random_bytes(32));

            cache()->put(
                "password_reset_token_{$user->id}",
                $resetToken,
                now()->addMinutes(config('auth.password_reset.expire', 60))
            );

            return $resetToken;
        }

        throw new Exception('Invalid OTP type.');
    }

    /**
     * Resend OTP for a given user based on type.
     */
    public function resendOtp(User $user, string $type): string
    {
        DB::table('otps')
            ->where('user_id', $user->id)
            ->where('type', $type)
            ->where('used', false)
            ->update(['used' => true]);

        return $this->createOtpForUser($user, $type);
    }
}
