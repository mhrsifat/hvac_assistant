<?php

use App\Http\Controllers\Api\V1\HvacModelController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/models', [HvacModelController::class, 'index']);
    Route::get('/models/{slug}', [HvacModelController::class, 'show']);
});
