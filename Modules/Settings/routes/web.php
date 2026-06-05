<?php

use Illuminate\Support\Facades\Route;
use Modules\Settings\Http\Controllers\DatabaseManagerController;
use Modules\Settings\Http\Controllers\DevelopmentController;
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

            Route::get('google', [IntegrationSettingController::class, 'google'])
                ->name('integration-settings.google.edit');

            Route::post('google', [IntegrationSettingController::class, 'updateGoogle'])
                ->name('integration-settings.google.update');

            Route::get('apple', [IntegrationSettingController::class, 'apple'])
                ->name('integration-settings.apple.edit');

            Route::post('apple', [IntegrationSettingController::class, 'updateApple'])
                ->name('integration-settings.apple.update');
        });
    });

    Route::prefix('settings/development')->group(function () {
        Route::get('chat-broadcast-tester', [DevelopmentController::class, 'broadcastTester'])
            ->name('development.chat-broadcast-tester')
            ->middleware('role:super-admin|admin');

        Route::middleware('role:super-admin|admin')->group(function () {
            Route::get('db-manager', [DatabaseManagerController::class, 'index'])
                ->name('development.db-manager');
            Route::get('db-manager/download/{connection}', [DatabaseManagerController::class, 'download'])
                ->name('development.db-manager.download');
            Route::get('db-manager/download-all', [DatabaseManagerController::class, 'downloadAll'])
                ->name('development.db-manager.download-all');
            Route::post('db-manager/upload/{connection}', [DatabaseManagerController::class, 'upload'])
                ->name('development.db-manager.upload');
        });
    });

    Route::resource('settings', SettingsController::class)->names('settings');
});
