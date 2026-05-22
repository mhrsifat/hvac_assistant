<?php

use Illuminate\Support\Facades\Route;
use Modules\Vector\Http\Controllers\VectorController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('vectors', VectorController::class)->names('vector');
});
