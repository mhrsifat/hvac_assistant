<?php

use Illuminate\Support\Facades\Route;
use Modules\Monetization\Http\Controllers\PlanController;

Route::middleware(['auth', 'verified', 'role:admin|super-admin'])
    ->controller(PlanController::class)
    ->prefix('plans')
    ->name('plans.')
    ->group(function (): void {
        Route::get('/', 'index')->name('index');
        Route::post('/', 'store')->name('store');
        Route::get('{plan}', 'show')->name('show');
        Route::patch('{plan}', 'update')->name('update');
        Route::delete('{plan}', 'destroy')->name('destroy');
    });