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

        Route::get('{brand}', 'show')->name('show');
        Route::patch('{brand}', 'update')->name('update');
        Route::delete('{brand}', 'destroy')->name('destroy');

        Route::post('{brand}/documents', 'storeDocument')->name('documents.store');
        Route::delete('{brand}/documents/{document}', 'destroyDocument')->name('documents.destroy');
        Route::post('{brand}/documents/{document}/feed', 'feedDocument')->name('documents.feed');

        Route::post('{brand}/error-codes', 'storeErrorCode')->name('error-codes.store');
        Route::delete('{brand}/error-codes/{errorCode}', 'destroyErrorCode')->name('error-codes.destroy');
    });
