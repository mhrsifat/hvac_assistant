<?php

use Illuminate\Support\Facades\Route;
use Modules\Legal\Http\Controllers\LegalPageController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('settings/privacy-policy', [LegalPageController::class, 'edit'])
        ->middleware('role:super-admin|admin')
        ->defaults('slug', 'privacy-policy')
        ->name('static-pages.privacy-policy.edit');

    Route::post('settings/privacy-policy', [LegalPageController::class, 'update'])
        ->middleware('role:super-admin|admin')
        ->defaults('slug', 'privacy-policy')
        ->name('static-pages.privacy-policy.update');

    Route::get('settings/terms-and-conditions', [LegalPageController::class, 'edit'])
        ->middleware('role:super-admin|admin')
        ->defaults('slug', 'terms-and-conditions')
        ->name('static-pages.terms-and-conditions.edit');

    Route::post('settings/terms-and-conditions', [LegalPageController::class, 'update'])
        ->middleware('role:super-admin|admin')
        ->defaults('slug', 'terms-and-conditions')
        ->name('static-pages.terms-and-conditions.update');
});
