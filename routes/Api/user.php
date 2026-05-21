<?php

use App\Http\Controllers\Api\User\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('user')->group(function () {

    Route::post('/update-password', [UserController::class, 'changePassword'])->middleware('auth:api');
    Route::get('/user-info', [UserController::class, 'userInfo'])->middleware('auth:api');
    Route::post('/update-profile', [UserController::class, 'updateProfile'])->middleware('auth:api');
});
