<?php

use App\Http\Controllers\Api\V1\BrandController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/brands', [BrandController::class, 'index']);
});
