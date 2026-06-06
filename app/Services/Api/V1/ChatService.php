<?php

namespace App\Services\Api\V1;

use App\Events\ChatStatusUpdated;
use App\Helpers\Helper;
use App\Http\Resources\Api\V1\ChatResource;
use App\Http\Resources\Api\V1\MessageResource;
use App\Jobs\GenerateAiResponseJob;
use App\Models\Chat;
use App\Models\ChatMessage;
use App\Models\HvacModel;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class ChatService
{
    public function startChat($user, $hvacModelSlug)
    {
        $hvacModel = HvacModel::where('slug', $hvacModelSlug)->firstOrFail();

        $chat = Chat::create([
            'user_id' => $user->id,
            'hvac_model_id' => $hvacModel->id,
            'title' => 'Chat about '.$hvacModel->name,
            'status' => 'active',
        ]);

        $chat->load('hvacModel');

        return new ChatResource($chat);
    }

    public function listChats($user, $request)
    {
        $query = Chat::with('hvacModel.brand')->where('user_id', $user->id);

        if ($request->has('hvac_model_slug')) {
            $query->whereHas('hvacModel', function ($q) use ($request) {
                $q->where('slug', $request->hvac_model_slug);
            });
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhereHas('hvacModel', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhereHas('brand', function ($q) use ($search) {
                                $q->where('name', 'like', "%{$search}%");
                            });
                    });
            });
        }

        return ChatResource::collection($query->latest()->paginate(15));
    }

    public function sendMessage($user, $chatSlug, $request)
    {
        $chat = Chat::where('slug', $chatSlug)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $attachmentsData = [];
        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                // Returns string like "communication/attachments/xxxx.png"
                $path = Helper::uploadFile($file, 'communication/attachments', 'chat');

                // Format matching Demo structure
                $attachmentsData[] = [
                    'url' => Storage::url($path),
                    'mimeType' => $file->getMimeType(),
                    'name' => $file->getClientOriginalName(),
                    'size' => $file->getSize(),
                ];
            }
        }

        $message = ChatMessage::create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'sender_role' => 'user',
            'content' => $request->content,
            'attachments' => empty($attachmentsData) ? null : json_encode($attachmentsData),
        ]);

        // Real-time Status & AI Processing
        Cache::put("chat_{$chatSlug}_analyzing", true, now()->addMinutes(5));
        broadcast(new ChatStatusUpdated($chatSlug, true));
        GenerateAiResponseJob::dispatch($chatSlug, $message->id);

        $message->load('chat');

        return new MessageResource($message);
    }

    public function getMessages($user, $chatSlug, $request)
    {
        $chat = Chat::where('slug', $chatSlug)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $messages = $chat->messages()->latest()->paginate(20);

        return MessageResource::collection($messages)->additional([
            'is_analyzing' => Cache::get("chat_{$chatSlug}_analyzing", false),
        ]);
    }

    public function deleteChat($user, $chatSlug)
    {
        $chat = Chat::where('slug', $chatSlug)
            ->where('user_id', $user->id)
            ->firstOrFail();

        // 1. Delete all attachments associated with chat's messages
        $messages = $chat->messages()->whereNotNull('attachments')->get();
        foreach ($messages as $message) {
            $attachments = is_array($message->attachments) ? $message->attachments : json_decode($message->attachments, true);
            if ($attachments) {
                foreach ($attachments as $attachment) {
                    if (isset($attachment['url'])) {
                        Helper::deleteFile($attachment['url']);
                    }
                }
            }
        }

        // 3. Delete Chat (cascade will handle DB rows or they are deleted now)
        $chat->delete();

        // 4. Clear cache
        Cache::forget("chat_{$chatSlug}_analyzing");

        return true;
    }
}
