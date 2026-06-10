<?php

use App\Http\Controllers\Web\DashboardController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return Auth::check()
        ? redirect()->route('dashboard') // if logged in, go to dashboard
        : inertia('auth/login'); // otherwise, show login
})->name('home');

Route::middleware(['auth', 'verified', 'role:admin|super-admin'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    // Route::inertia('chat-broadcast-tester', 'tools/chat-broadcast-tester')->name('chat.broadcast-tester');
});

require __DIR__.'/Web/settings.php';
require __DIR__.'/Web/auth.php';

require __DIR__.'/Web/v1/brands.php';
require __DIR__.'/Web/v1/hvac_models.php';
require __DIR__.'/Web/v1/chats.php';
require __DIR__.'/Web/v1/users.php';
require __DIR__.'/Web/v1/user_search.php';
