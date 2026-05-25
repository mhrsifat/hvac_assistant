<?php

use App\Http\Controllers\Web\HvacModelController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:admin|super-admin'])->group(function (): void {
    Route::get('hvac-models', [HvacModelController::class, 'index'])->name('hvac-models.index');
    Route::post('hvac-models', [HvacModelController::class, 'store'])->name('hvac-models.store');
    Route::patch('hvac-models/{hvacModel}', [HvacModelController::class, 'update'])->name('hvac-models.update');
    Route::delete('hvac-models/{hvacModel}', [HvacModelController::class, 'destroy'])->name('hvac-models.destroy');
});
