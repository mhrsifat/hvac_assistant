<?php

namespace App\Http\Controllers;

use App\Events\ConversationUpdated;
use App\Models\Chat;
use App\Models\ChatMessage;
use App\Services\AiChatService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class ChatController extends Controller
{
    public function __construct(protected AiChatService $aiChatService) {}

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'hvac_model_id' => ['nullable', 'integer', 'exists:hvac_models,id'],
            'title' => ['required', 'string', 'max:255'],
        ]);

        $chat = Chat::create([
            'user_id' => (int) $request->user()->id,
            'hvac_model_id' => $validated['hvac_model_id'] ?? null,
            'title' => $validated['title'],
            'status' => 'active',
        ]);

        $chat->load('user');

        return response()->json([
            'chat' => $chat,
        ], 201);
    }

    public function sendMessage(Request $request, Chat $chat): JsonResponse
    {
        $this->ensureChatAccess($request, $chat);

        $validated = $request->validate([
            'content' => ['required', 'string'],
        ]);

        $userMessage = ChatMessage::create([
            'chat_id' => $chat->id,
            'sender_id' => (int) $request->user()->id,
            'sender_role' => 'user',
            'content' => $validated['content'],
        ]);

        $aiResponseText = $this->aiChatService->processMessage(
            $validated['content'],
            $chat->hvac_model_id,
        );

        $aiMessage = ChatMessage::create([
            'chat_id' => $chat->id,
            'sender_id' => null,
            'sender_role' => 'assistant',
            'content' => $aiResponseText,
        ]);

        $chat->loadMissing('user');

        event(new ConversationUpdated($chat, $aiMessage));

        return response()->json([
            'chat' => $chat->fresh(),
            'user_message' => $userMessage,
            'ai_message' => $aiMessage,
        ], 201);
    }

    private function ensureChatAccess(Request $request, Chat $chat): void
    {
        $user = $request->user();

        if ($chat->user_id === $user->id) {
            return;
        }

        if (method_exists($user, 'hasAnyRole') && $user->hasAnyRole(['admin', 'super-admin'])) {
            return;
        }

        throw ValidationException::withMessages([
            'chat' => 'You are not allowed to access this conversation.',
        ]);
    }
}
