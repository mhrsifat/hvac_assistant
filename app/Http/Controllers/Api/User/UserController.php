<?php

namespace App\Http\Controllers\Api\User;

use App\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\User\ChangePasswordRequest;
use App\Http\Requests\Api\User\UpdateProfileRequest;
use App\Http\Resources\Api\User\SellerResource;
use App\Http\Resources\Api\User\UserResource;
use App\Services\Api\User\SellerService;
use App\Services\Api\User\UserService;
use Exception;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class UserController extends Controller
{
    use ApiResponse;

    private UserService $userService;

    private SellerService $sellerService;

    public function __construct(UserService $userService, SellerService $sellerService)
    {
        $this->userService = $userService;
        $this->sellerService = $sellerService;
    }

    /**
     * Get user info.
     */
    public function userInfo()
    {
        return $this->success(200, 'User details fetched successfully.', [
            'user' => new UserResource(auth('api')->user()),
        ]);
    }

    /**
     * Update the authenticated user's profile information.
     */
    public function updateProfile(UpdateProfileRequest $request)
    {
        try {
            $user = auth('api')->user();

            $updatedUser = $this->userService->updateProfile(
                $user,
                $request->validated(),
                $request->file('avatar'),
                $request->file('cover_photo')
            );

            if ($user->hasRole(['admin', 'super-admin'])) {
                $returnData = [
                    'admin' => new UserResource($updatedUser),
                ];
            } elseif ($user->hasRole('seller')) {
                $returnData = ['seller' => new SellerResource($updatedUser)];
            } else {
                $returnData = ['user' => new UserResource($updatedUser)];
            }

            return $this->success(200, 'Profile updated successfully.', $returnData);
        } catch (Exception $e) {
            Log::error('UserController::updateProfile: '.$e->getMessage());

            return $this->error(500, 'Failed to update profile.');
        }
    }

    /**
     * Update the authenticated user's password.
     */
    public function changePassword(ChangePasswordRequest $request)
    {
        try {
            $validatedData = $request->validated();
            $user = auth('api')->user();

            if (! Hash::check($validatedData['current_password'], $user->password)) {
                return $this->error(422, 'Current password is incorrect.');
            }

            $user->update(['password' => bcrypt($validatedData['new_password'])]);

            return $this->success(200, 'Password updated successfully.');
        } catch (Exception $e) {
            Log::error('UserController::changePassword: '.$e->getMessage());

            return $this->error(500, 'Failed to update password.');
        }
    }
}
