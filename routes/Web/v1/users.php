<?php

use App\Http\Controllers\Web\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:admin|super-admin'])
    ->controller(UserController::class)
    ->prefix('users')
    ->name('users.')
    ->group(function (): void {
        Route::get('/', 'index')->name('index');
        Route::get('{user}', 'show')->name('show');
        Route::patch('{user}', 'update')->name('update');
        Route::post('{user}/soft-delete', 'softDelete')->name('soft-delete');
        Route::delete('{user}', 'forceDelete')->name('force-delete');
    });
