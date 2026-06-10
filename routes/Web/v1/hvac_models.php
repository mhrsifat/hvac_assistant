<?php

use App\Http\Controllers\Web\HvacModelController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:admin|super-admin'])
    ->controller(HvacModelController::class)
    ->prefix('hvac-models')
    ->name('hvac-models.')
    ->group(function (): void {
        Route::get('/', 'index')->name('index');
        Route::post('/', 'store')->name('store');

        Route::get('{hvacModel:slug}', 'show')->name('show');
        Route::patch('{hvacModel:slug}', 'update')->name('update');
        Route::delete('{hvacModel:slug}', 'destroy')->name('destroy');

        Route::post('{hvacModel:slug}/documents', 'storeDocument')->name('documents.store');
        Route::post('{hvacModel:slug}/documents/{document}/feed', 'feedDocument')->name('documents.feed');
        Route::delete('{hvacModel:slug}/documents/{document}', 'destroyDocument')->name('documents.destroy');

        Route::post('{hvacModel:slug}/error-codes', 'storeErrorCode')->name('error-codes.store');
        Route::delete('{hvacModel:slug}/error-codes/{errorCode}', 'destroyErrorCode')->name('error-codes.destroy');
    });
