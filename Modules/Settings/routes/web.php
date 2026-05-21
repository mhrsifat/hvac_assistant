<?php

use Illuminate\Support\Facades\Route;
use Modules\Settings\Http\Controllers\SettingsController;
use Modules\Settings\Http\Controllers\SystemSettingController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('settings/system', [SystemSettingController::class, 'edit'])
        ->middleware('role:super-admin|admin')
        ->name('system-settings.edit');

    Route::post('settings/system', [SystemSettingController::class, 'update'])
        ->middleware('role:super-admin|admin')
        ->name('system-settings.update');

    Route::resource('settings', SettingsController::class)->names('settings');
});
