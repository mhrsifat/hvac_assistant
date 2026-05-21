<?php

use App\Http\Controllers\Api\Settings\SettingsController;
use Illuminate\Support\Facades\Route;

Route::prefix('settings')->controller(SettingsController::class)->group(function () {
    Route::post('/smtp-settings', 'updateSmtpSettings')->middleware('auth:api');

    Route::get('/ai/providers', 'getAvailableAiProviders')->middleware(['auth:api', 'role_or_permission:admin|super_admin|manage.settings']);
    Route::post('/ai/set-key', 'setAiProviderApiKey')->middleware(['auth:api', 'role_or_permission:admin|super_admin|manage.settings']);
});
