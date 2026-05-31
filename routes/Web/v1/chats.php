<?php

use App\Http\Controllers\Web\ChatManagementController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:admin|super-admin'])
    ->controller(ChatManagementController::class)
    ->prefix('chats')
    ->name('chats.')
    ->group(function (): void {
        Route::get('/', 'index')->name('index');
        Route::post('/', 'store')->name('store');

        Route::patch('{chat}/status', 'updateStatus')
            ->name('update-status');

        Route::delete('{chat}', 'destroy')
            ->name('destroy');
    });
