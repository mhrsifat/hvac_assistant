<?php

namespace App\Services\Api\User;

use App\Helpers\Helper;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class UserService
{
    /**
     * Update user profile including file uploads.
     */
    public function updateProfile(User $user, array $data, ?UploadedFile $avatar, ?UploadedFile $coverPhoto): User
    {
        // Handle password update
        // if (! empty($data['password'])) {
        //     $data['password'] = bcrypt($data['password']);
        // } else {
        //     unset($data['password']);
        // }

        // Upload Avatar
        if ($avatar) {
            if (! empty($user->avatar)) {
                Helper::deleteFile($user->getRawOriginal('avatar'));
            }
            $data['avatar'] = Helper::uploadFile($avatar, 'user/avatar', 'avatar');
        }

        // Upload Cover Photo
        if ($coverPhoto) {
            if (! empty($user->cover_photo)) {
                // Delete old cover photo from storage
                Helper::deleteFile($user->getRawOriginal('cover_photo'));
            }
            $data['cover_photo'] = Helper::uploadFile($coverPhoto, 'user/cover_photo', 'cover_photo_');
        }

        $user->update($data);

        return $user;
    }
}
