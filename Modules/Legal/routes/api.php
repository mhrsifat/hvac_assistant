<?php

use Illuminate\Support\Facades\Route;
use Modules\Legal\Http\Controllers\LegalController;

Route::middleware([])->group(function () {
    // Route::apiResource('legals', LegalController::class)->names('legal');
    //terms and conditions fetch
    Route::get('/terms-and-conditions', [LegalController::class, 'termsAndConditions'])
        ->name('legal.terms-and-conditions');
    //privacy policy fetch
    Route::get('/privacy-policy', [LegalController::class, 'privacyPolicy'])
        ->name('legal.privacy-policy');
});
