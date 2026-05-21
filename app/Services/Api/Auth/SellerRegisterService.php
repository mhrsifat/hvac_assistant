<?php

namespace App\Services\Api\Auth;

use App\Helpers\Helper;
use App\Models\BusinessDetail;
use App\Models\Store;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class SellerRegisterService
{
    private OTPService $otpService;

    private TokenService $tokenService;

    public function __construct(OTPService $otpService, TokenService $tokenService)
    {
        $this->otpService = $otpService;
        $this->tokenService = $tokenService;
    }

    public function register(array $data, bool $otpVerification = true): array
    {
        if (! array_key_exists('nid_document_file', $data) && is_string($data['nid_document_url'] ?? null)) {
            $data['nid_document_file'] = $data['nid_document_url'];
        }

        if (! array_key_exists('store_logo_file', $data) && is_string($data['store_logo_url'] ?? null)) {
            $data['store_logo_file'] = $data['store_logo_url'];
        }

        if (! array_key_exists('store_logo_file_2', $data) && is_string($data['store_logo_url_2'] ?? null)) {
            $data['store_logo_file_2'] = $data['store_logo_url_2'];
        }

        $data['nid_document_file'] = $this->resolveUploadedFileOrPath($data['nid_document_file'] ?? null, 'seller/nid_documents', 'nid_doc_');
        $data['store_logo_file'] = $this->resolveUploadedFileOrPath($data['store_logo_file'] ?? null, 'seller/store_logos', 'store_logo_');
        $data['store_logo_file_2'] = $this->resolveUploadedFileOrPath($data['store_logo_file_2'] ?? null, 'seller/store_logos', 'store_logo_2_');

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
                'username' => $data['username'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'phone' => $data['phone'],
                'terms_and_conditions' => $data['terms_and_conditions'] ?? false,
                'seller_status' => 'pending',
            ]);

            if (method_exists($user, 'assignRole')) {
                $user->assignRole('seller');
            }

            BusinessDetail::create([
                'user_id' => $user->id,
                'business_type' => $data['business_type'],
                'company_name' => $data['company_name'] ?? null,
                'tax_id_or_reg_number' => $data['tax_id_or_reg_number'] ?? null,
                'industry_category' => $data['industry_category'] ?? null,
                'country' => $data['country'] ?? null,
                'state' => $data['state'] ?? null,
                'city' => $data['city'] ?? null,
                'zip_code' => $data['zip_code'] ?? null,
                'address_line' => $data['address_line'] ?? null,
                'nid_document_file' => $data['nid_document_file'] ?? null,
            ]);

            Subscription::create([
                'user_id' => $user->id,
                'payout_method' => $data['payout_method'],
                'stripe_account_id' => $data['stripe_account_id'] ?? null,
                'account_holder_name' => $data['account_holder_name'] ?? null,
                'bank_name' => $data['bank_name'] ?? null,
                'account_number' => $data['account_number'] ?? null,
                'swift_routing_code' => $data['swift_routing_code'] ?? null,
                'payout_frequency' => $data['payout_frequency'] ?? null,
            ]);

            Store::create([
                'user_id' => $user->id,
                'store_name' => $data['store_name'],
                'store_description' => $data['store_description'] ?? null,
                'store_logo_file' => $data['store_logo_file'] ?? null,
                'store_logo_file_2' => $data['store_logo_file_2'] ?? null,
                'contact_email' => $data['contact_email'],
                'contact_phone' => $data['contact_phone'] ?? null,
                'is_active' => false,
            ]);

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

    private function resolveUploadedFileOrPath(mixed $value, string $directory, string $prefix): ?string
    {
        if ($value instanceof UploadedFile) {
            return Helper::uploadFile($value, $directory, $prefix);
        }

        if (is_string($value) && trim($value) !== '') {
            return trim($value);
        }

        return null;
    }
}
