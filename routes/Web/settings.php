<?php

use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\StaticPageController;
use App\Http\Controllers\Settings\SystemSettingController;
use App\Http\Controllers\Settings\TwoFactorAuthenticationController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
});

Route::middleware(['auth', 'verified'])->group(function () {
    // Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('user-password.edit');

    Route::put('settings/password', [PasswordController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::inertia('settings/appearance', 'settings/appearance')->name('appearance.edit');

    Route::get('settings/system', [SystemSettingController::class, 'edit'])->name('system-settings.edit');
    Route::post('settings/system', [SystemSettingController::class, 'update'])->name('system-settings.update');
    

    Route::get('settings/privacy-policy', [StaticPageController::class, 'edit'])
        ->defaults('slug', 'privacy-policy')
        ->name('static-pages.privacy-policy.edit');

    Route::post('settings/privacy-policy', [StaticPageController::class, 'update'])
        ->defaults('slug', 'privacy-policy')
        ->name('static-pages.privacy-policy.update');

    Route::get('settings/terms-and-conditions', [StaticPageController::class, 'edit'])
        ->defaults('slug', 'terms-and-conditions')
        ->name('static-pages.terms-and-conditions.edit');

    Route::post('settings/terms-and-conditions', [StaticPageController::class, 'update'])
        ->defaults('slug', 'terms-and-conditions')
        ->name('static-pages.terms-and-conditions.update');

    // Route::get('settings/two-factor', [TwoFactorAuthenticationController::class, 'show'])->name('two-factor.show');
});
