<?php

use Illuminate\Support\Facades\Route;
use Modules\Monetization\Http\Controllers\Web\AnalyticsController;
use Modules\Monetization\Http\Controllers\Web\PlanController;
use Modules\Monetization\Http\Controllers\Web\SubscriptionController;
use Modules\Monetization\Http\Controllers\Web\TransactionController;

Route::middleware(['auth', 'verified', 'role:admin|super-admin'])
    ->controller(AnalyticsController::class)
    ->prefix('monetization')
    ->name('monetization.')
    ->group(function (): void {
        Route::get('analytics', 'index')->name('analytics');
    });

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

Route::middleware(['auth', 'verified', 'role:admin|super-admin'])
    ->controller(SubscriptionController::class)
    ->prefix('subscriptions')
    ->name('subscriptions.')
    ->group(function (): void {
        Route::get('/', 'index')->name('index');
        Route::post('/', 'store')->name('store');
        Route::get('{subscription}', 'show')->name('show');
        Route::post('{subscription}/cancel', 'cancel')->name('cancel');
        Route::post('{subscription}/extend', 'extend')->name('extend');
        Route::post('{subscription}/pause', 'pause')->name('pause');
        Route::post('{subscription}/reactivate', 'reactivate')->name('reactivate');
        Route::post('{subscription}/reduce', 'reduceDays')->name('reduce');
    });

Route::middleware(['auth', 'verified', 'role:admin|super-admin'])
    ->controller(TransactionController::class)
    ->prefix('transactions')
    ->name('transactions.')
    ->group(function (): void {
        Route::get('/', 'index')->name('index');
        Route::post('/', 'store')->name('store');
        Route::get('{transaction}', 'show')->name('show');
    });
