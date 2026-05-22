<?php

use Illuminate\Support\Facades\Route;
use Modules\Vector\Http\Controllers\VectorController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('vectors', VectorController::class)->names('vector');
});
