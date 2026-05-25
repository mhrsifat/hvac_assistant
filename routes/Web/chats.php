<?php

use App\Http\Controllers\Web\ChatManagementController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:admin|super-admin'])->group(function (): void {
    Route::get('chats', [ChatManagementController::class, 'index'])->name('chats.index');
    Route::post('chats', [ChatManagementController::class, 'store'])->name('chats.store');
    Route::patch('chats/{chat}/status', [ChatManagementController::class, 'updateStatus'])->name('chats.update-status');
    Route::delete('chats/{chat}', [ChatManagementController::class, 'destroy'])->name('chats.destroy');
});
