<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('user.{username}', function ($user, string $username): bool {
    return (string) $user->username === $username;
});
