<?php

use App\Http\Controllers\Api\V1\ChatController;
use Illuminate\Support\Facades\Route;

Route::controller(ChatController::class)
    ->prefix('v1/chats')
    ->name('chats.')
    ->middleware('auth:api')
    ->group(function () {
        Route::post('/start/{hvac_model_slug}', 'startChat')
            ->name('start');

        Route::get('/', 'listChats')
            ->name('list');

        Route::post('/send/{chat_slug}', 'sendMessage')
            ->name('send.message');

        Route::get('/{chat_slug}', 'getMessages')
            ->name('get.messages');

        Route::patch('/{chat_slug}', 'renameChat')
            ->name('rename');

        Route::delete('/{chat_slug}', 'deleteChat')
            ->name('delete');
    });
