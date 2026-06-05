<?php

use App\Http\Controllers\ChatController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:api')->group(function (): void {
    Route::post('/broadcasting/auth', function (Request $request) {
        return Broadcast::auth($request);
    });

    Route::post('/chats', [ChatController::class, 'store']);
    Route::post('/chats/{chat}/messages', [ChatController::class, 'sendMessage']);
});

require __DIR__.'/Api/auth.php';
require __DIR__.'/Api/user.php';
require __DIR__.'/Api/settings.php';

require __DIR__.'/Web/v1/brands.php';
require __DIR__.'/Web/v1/hvac_models.php';
require __DIR__.'/Web/v1/chats.php';

require __DIR__.'/Api/v1/brands.php';
require __DIR__.'/Api/v1/hvac_models.php';
