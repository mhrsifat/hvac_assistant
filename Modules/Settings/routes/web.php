<?php

use Illuminate\Support\Facades\Route;
use Modules\Settings\Http\Controllers\IntegrationSettingController;
use Modules\Settings\Http\Controllers\SettingsController;
use Modules\Settings\Http\Controllers\SystemSettingController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::middleware('role:super-admin|admin')->group(function () {
        Route::get('settings/system', [SystemSettingController::class, 'edit'])
            ->name('system-settings.edit');

        Route::post('settings/system', [SystemSettingController::class, 'update'])
            ->name('system-settings.update');

        Route::prefix('settings/integration')->group(function () {
            Route::get('smtp', [IntegrationSettingController::class, 'smtp'])
                ->name('integration-settings.smtp.edit');

            Route::post('smtp', [IntegrationSettingController::class, 'updateSmtp'])
                ->name('integration-settings.smtp.update');

            Route::get('ai', [IntegrationSettingController::class, 'ai'])
                ->name('integration-settings.ai.edit');

            Route::post('ai', [IntegrationSettingController::class, 'updateAi'])
                ->name('integration-settings.ai.update');
        });
    });

    Route::resource('settings', SettingsController::class)->names('settings');
});
