<?php

use App\Http\Controllers\Api\V1\ChatController;
use Illuminate\Support\Facades\Route;

Route::controller(ChatController::class)
    ->prefix('chats')
    ->name('chats.')
    ->middleware('auth:api')
    ->group(function () {

        /*
        |--------------------------------------------------------------------------
        | [AI CONTEXT & GLOBAL INSTRUCTIONS]
        |--------------------------------------------------------------------------
        | AI, when generating logic for these routes, note the following:
        | 1. Models: User, HvacModel, Brand, Chat, Message, Attachment.
        | 2. File Storage: Use `App\Helpers::uploadFile($file, $directory, $prefix)` and `deleteFile()`.
        | 3. REAL-TIME BROADCASTING: We use Laravel Events (using Reverb).
        |    You must generate events like `ChatStatusUpdated` and `NewMessageReceived` that implement `ShouldBroadcastNow`.
        */

        /*
        |--------------------------------------------------------------------------
        | 1. Start a New Chat
        |--------------------------------------------------------------------------
        | [AI INSTRUCTION]
        | - Method: startChat(Request $request, $hvac_model_slug)
        | - Action: Create a new Chat record linked to the authenticated user and the provided HVAC model.
        | - Return: The newly created Chat object via a ChatResource.
        */
        Route::post('/start/{hvac_model_slug}', 'startChat')
            ->name('start');

        /*
        |--------------------------------------------------------------------------
        | 2. List All Chats
        |--------------------------------------------------------------------------
        | [AI INSTRUCTION]
        | - Method: listChats(Request $request)
        | - Action: Return a paginated list of chats belonging to auth()->user().
        | - Filter: If `$request->has('hvac_model_slug')`, filter the query by that slug.
        | - Search: If `$request->has('search')`, search across:
        |   a) Chat title
        |   b) HvacModel name (via relationship)
        |   c) Brand name (via HvacModel->Brand relationship)
        | - Return: AnonymousResourceCollection of ChatResource.
        */
        Route::get('/', 'listChats')
            ->name('list');

        /*
        |--------------------------------------------------------------------------
        | 3. Send a Message (with Broadcasting & Background Jobs)
        |--------------------------------------------------------------------------
        | [AI INSTRUCTION]
        | - Method: sendMessage(SendMessageRequest $request, $chat_slug)
        | - Action:
        |   1. Find the Chat by $chat_slug for the auth user.
        |   2. Create a new Message record (type can be 'text' or 'attachment', sender_role = 'user').
        |   3. File Handling: If $request->hasFile('files'), iterate through them.
        |      - Support mime types for: images, zip, gz, pdf, docx, xlsx, csv, json, xml, ndvr, etc.
        |      - Store files: use `App\Helpers::uploadFile($file, $directory, $prefix)`.
        |      - Create `Attachment` records linked to the Message containing url, mimeType, name, and size.
        |   4. Real-time Status & AI Processing:
        |      - Set fallback cache: `Cache::put("chat_{$chat_slug}_analyzing", true, now()->addMinutes(5));`
        |      - FIRE EVENT: `broadcast(new ChatStatusUpdated($chat_slug, true));` (Tells frontend AI is thinking).
        |      - DISPATCH JOB: `GenerateAiResponseJob::dispatch($chat_slug, $message->id);`
        | - Return: A MessageResource formatted EXACTLY like the demo below.
        |   - The `is_analyzing` field should check `Cache::get("chat_{$chat_slug}_analyzing", false)`.
        |
        | [AI INSTRUCTION FOR GenerateAiResponseJob]
        | - Inside the job's handle() method:
        |   1. Get AI response.
        |   2. Save new Message record (sender_role = 'ai').
        |   3. Clear cache: `Cache::forget("chat_{$chat_slug}_analyzing");`
        |   4. FIRE EVENT: `broadcast(new ChatStatusUpdated($chat_slug, false));` (Tells frontend AI is done).
        |   5. FIRE EVENT: `broadcast(new NewMessageReceived($aiMessageResource));` (Pushes new msg to frontend).
        |
        | DEMO RESPONSE STRUCTURE TO MATCH:
        | {
        |   "id": "msg_01kte7qvpq6k7x5sn2n4ne33a6",
        |   "sender_role": "user", // user, ai, system, support
        |   "is_analyzing": true,
        |   "type": "attachment",
        |   "content": "WHY2",
        |   "attachments": [
        |     {
        |       "url": "https://domain.com/storage/communication/attachments/e2QP7...Z.png",
        |       "mimeType": "image/gif",
        |       "name": "Screenshot 2025-12-11.png",
        |       "size": 34067
        |     }
        |   ],
        |   "status": "sent",
        |   "created_at": "2026-06-06T10:30:28.000000Z"
        | }
        */
        Route::post('/send/{chat_slug}', 'sendMessage')
            ->name('send.message');

        /*
        |--------------------------------------------------------------------------
        | 4. Get Chat Messages
        |--------------------------------------------------------------------------
        | [AI INSTRUCTION]
        | - Method: getMessages(Request $request, $chat_slug)
        | - Action: Find Chat by slug for auth user. Retrieve paginated messages.
        | - Ensure the JSON response wraps the messages in the same MessageResource used in `sendMessage`,
        |   and include the current `is_analyzing` cache status for the chat thread at the top level of the response.
        */
        Route::get('/{chat_slug}', 'getMessages')
            ->name('get.messages');

        /*
        |--------------------------------------------------------------------------
        | 5. Delete Chat
        |--------------------------------------------------------------------------
        | [AI INSTRUCTION]
        | - Method: deleteChat($chat_slug)
        | - Action: Find Chat by slug for auth user.
        | - Deletion logic:
        |   1. Iterate through all attachments associated with the chat's messages.
        |   2. Delete the physical files from the Storage disk. use `App\Helpers::deleteFile($fileUrl)` for this.
        |   3. Delete the Chat record (cascade should handle database messages/attachments if foreign keys are set up, otherwise manually delete them).
        |   4. Clear the `is_analyzing` cache key for this chat.
        | - Return: 204 No Content or a success JSON message.
        */
        Route::delete('/{chat_slug}', 'deleteChat')
            ->name('delete');
    });
