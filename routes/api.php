<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Route::get('/user', function (Request $request) {
//     return $request->user();
// })->middleware('auth:api');

require __DIR__.'/Api/auth.php';
require __DIR__.'/Api/user.php';
require __DIR__.'/Api/settings.php';
