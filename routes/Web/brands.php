<?php

use App\Http\Controllers\Web\BrandController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:admin|super-admin'])->group(function (): void {
    Route::get('brands', [BrandController::class, 'index'])->name('brands.index');
    Route::post('brands', [BrandController::class, 'store'])->name('brands.store');
    Route::patch('brands/{brand}', [BrandController::class, 'update'])->name('brands.update');
    Route::delete('brands/{brand}', [BrandController::class, 'destroy'])->name('brands.destroy');
});
