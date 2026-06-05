<?php

use App\Http\Controllers\Web\UserSearchController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:admin|super-admin'])
    ->get('user-search', [UserSearchController::class, 'search'])
    ->name('user-search');
