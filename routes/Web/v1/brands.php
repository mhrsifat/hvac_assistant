<?php

use App\Http\Controllers\Web\BrandController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:admin|super-admin'])
    ->controller(BrandController::class)
    ->prefix('brands')
    ->name('brands.')
    ->group(function (): void {
        Route::get('/', 'index')->name('index');
        Route::post('/', 'store')->name('store');

        Route::get('{brand:slug}', 'show')->name('show');
        Route::patch('{brand:slug}', 'update')->name('update');
        Route::delete('{brand:slug}', 'destroy')->name('destroy');

        Route::post('{brand:slug}/documents', 'storeDocument')->name('documents.store');
        Route::delete('{brand:slug}/documents/{document}', 'destroyDocument')->name('documents.destroy');
        Route::post('{brand:slug}/documents/{document}/feed', 'feedDocument')->name('documents.feed');

        Route::post('{brand:slug}/error-codes', 'storeErrorCode')->name('error-codes.store');
        Route::delete('{brand:slug}/error-codes/{errorCode}', 'destroyErrorCode')->name('error-codes.destroy');
    });
