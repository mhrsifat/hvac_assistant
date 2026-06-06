<?php

namespace App\Http\Controllers\Api\V1;

use App\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\SendMessageRequest;
use App\Services\Api\V1\ChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    use ApiResponse;

    public function __construct(protected ChatService $chatService) {}

    public function startChat(Request $request, $hvac_model_slug): JsonResponse
    {
        try {
            $chat = $this->chatService->startChat($request->user(), $hvac_model_slug);

            return $this->successResponse($chat, 'Chat started successfully.', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function listChats(Request $request): JsonResponse
    {
        try {
            $chats = $this->chatService->listChats($request->user(), $request);

            return $this->successResponse($chats, 'Chats retrieved successfully.');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function sendMessage(SendMessageRequest $request, $chat_slug): JsonResponse
    {
        try {
            $message = $this->chatService->sendMessage($request->user(), $chat_slug, $request);

            return $this->successResponse($message, 'Message sent successfully.', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function getMessages(Request $request, $chat_slug): JsonResponse
    {
        try {
            $messages = $this->chatService->getMessages($request->user(), $chat_slug, $request);

            // Reconstruct the pagination data from the resource collection using the standard approach
            $data = $messages->response()->getData(true);

            return response()->json([
                'success' => true,
                'code' => 200,
                'message' => 'Messages retrieved successfully.',
                'data' => $data['data'],
                'links' => $data['links'] ?? null,
                'meta' => $data['meta'] ?? null,
                'is_analyzing' => $data['is_analyzing'] ?? false,
            ], 200);

        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function deleteChat(Request $request, $chat_slug): JsonResponse
    {
        try {
            $this->chatService->deleteChat($request->user(), $chat_slug);

            return $this->successResponse(null, 'Chat deleted successfully.', 204);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }
}
