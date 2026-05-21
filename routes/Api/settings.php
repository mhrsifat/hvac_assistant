<?php

use App\Http\Controllers\Api\Settings\SettingsController;
use Illuminate\Support\Facades\Route;

Route::prefix('settings')->controller(SettingsController::class)->group(function () {
    Route::post('/smtp-settings', 'updateSmtpSettings')->middleware('auth:api');
});
