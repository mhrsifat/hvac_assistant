<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:api')->group(function (): void {
    Route::post('/broadcasting/auth', function (Request $request) {
        return Broadcast::auth($request);
    });
});

require __DIR__.'/Api/auth.php';
require __DIR__.'/Api/user.php';
require __DIR__.'/Api/settings.php';

require __DIR__.'/Api/v1/brands.php';
require __DIR__.'/Api/v1/hvac_models.php';
require __DIR__.'/Api/v1/chats.php';
