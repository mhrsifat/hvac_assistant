<?php

namespace App\Http\Controllers\Api\V1;

use App\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\SendMessageRequest;
use App\Services\Api\V1\ChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ChatController extends Controller
{
    use ApiResponse;

    public function __construct(protected ChatService $chatService) {}

    public function startChat(Request $request, string $hvac_model_slug): JsonResponse
    {
        try {
            $chat = $this->chatService->startChat($request->user(), $hvac_model_slug);

            return $this->success(201, 'Chat started successfully.', $chat);
        } catch (\Exception $e) {
            return $this->error(500, $e->getMessage());
        }
    }

    public function listChats(Request $request): JsonResponse
    {
        try {
            $chats = $this->chatService->listChats($request->user(), $request);

            return $this->success(200, 'Chats retrieved successfully.', $chats);
        } catch (\Exception $e) {
            return $this->error(500, $e->getMessage());
        }
    }

    public function sendMessage(SendMessageRequest $request, string $chat_slug): JsonResponse
    {
        try {
            $message = $this->chatService->sendMessage($request->user(), $chat_slug, $request);

            return $this->success(201, 'Message sent successfully.', $message);
        } catch (\Exception $e) {
            return $this->error(500, $e->getMessage());
        }
    }

    public function getMessages(Request $request, string $chat_slug): JsonResponse
    {
        try {
            $messages = $this->chatService->getMessages($request->user(), $chat_slug, $request);

            return $this->success(200, 'Messages retrieved successfully.', $messages);

        } catch (\Exception $e) {
            return $this->error(500, $e->getMessage());
        }
    }

    public function deleteChat(Request $request, string $chat_slug): JsonResponse
    {
        try {
            $this->chatService->deleteChat($request->user(), $chat_slug);

            return $this->success(200, 'Chat deleted successfully.', []);
        } catch (\Exception $e) {
            return $this->error(500, $e->getMessage());
        }
    }

    public function renameChat(Request $request, string $chat_slug): JsonResponse
    {
        try {
            $request->validate([
                'title' => ['required', 'string', 'max:255'],
            ]);

            $chat = $this->chatService->renameChat($request->user(), $chat_slug, $request->title);

            return $this->success(200, 'Chat renamed successfully.', $chat);
        } catch (ValidationException $e) {
            return $this->validationError($e);
        } catch (\Exception $e) {
            return $this->error(500, $e->getMessage());
        }
    }
}
