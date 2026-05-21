<?php

namespace App\Http\Controllers\Api\Auth;

use App\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Auth\SellerRegisterRequest;
use App\Services\Api\Auth\SellerRegisterService;
use Exception;
use Illuminate\Http\JsonResponse;

class SellerAuthController extends Controller
{
    use ApiResponse;

    public function __construct(private SellerRegisterService $sellerRegisterService) {}

    public function register(SellerRegisterRequest $request): JsonResponse
    {
        try {
            $otpVerification = config('auth.verification.enabled', false);

            $result = $this->sellerRegisterService->register(
                $request->validated(),
                $otpVerification
            );

            return $this->success(201, 'Seller registered successfully. Your account is pending approval.', $result);
        } catch (Exception $e) {
            return $this->error(500, $e->getMessage());
        }
    }
}
