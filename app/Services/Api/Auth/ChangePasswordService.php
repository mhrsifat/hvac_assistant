<?php

namespace App\Services\Api\Auth;

use App\Models\User;
use Exception;
use Illuminate\Support\Facades\Hash;

class ChangePasswordService
{
    public function changePassword(User $user, array $data): void
    {
        if (! Hash::check($data['old_password'], $user->password)) {
            throw new Exception('Current password is incorrect.');
        }

        $user->password = bcrypt($data['new_password']);
        $user->save();
    }
}
