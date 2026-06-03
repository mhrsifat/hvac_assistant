<?php

use Illuminate\Support\Facades\Route;
use Modules\Monetization\Http\Controllers\Api\PlanController;
use Modules\Monetization\Http\Controllers\Api\SubscriptionController;

// plans
Route::middleware([''])->controller(PlanController::class)->prefix('plans')->group(function () {
    Route::get('/', 'index')->name('plans.index');

    // user current plan
    Route::get('/my-plan', 'getCurrentUserPlan')->name('plans.my-plan')->middleware('auth:api');
});


// subscriptions
Route::middleware('auth:api')->prefix('subscriptions')->controller(SubscriptionController::class)->group(function () {
    Route::post('/apple/verify', 'verifyApple')->name('subscriptions.apple.verify');
    Route::post('/google/verify', 'verifyGoogle')->name('subscriptions.google.verify');
    Route::post('/cancel', 'cancel')->name('subscriptions.cancel');
    Route::post('/simulate', 'simulate')->name('subscriptions.simulate'); // demo route to simulate subscription (for testing)
});

// webhooks (unauthenticated)
// https://admin.davorron-martis.thesyndicates.team/liap/notifications
// Route::prefix('subscriptions/webhooks')->controller(SubscriptionController::class)->group(function () {
//     Route::post('/apple', 'appleWebhook')->name('subscriptions.webhooks.apple');
//     Route::post('/google', 'googleWebhook')->name('subscriptions.webhooks.google');
// });
