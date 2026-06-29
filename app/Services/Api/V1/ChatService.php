<?php

namespace App\Services\Api\V1;

use App\Events\ChatStatusUpdated;
use App\Events\ChatTitleUpdated;
use App\Helpers\Helper;
use App\Http\Resources\Api\V1\ChatResource;
use App\Http\Resources\Api\V1\MessageResource;
use App\Jobs\GenerateAiResponseJob;
use App\Models\Chat;
use App\Models\ChatMessage;
use App\Models\HvacModel;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\HttpException;

use function Laravel\Ai\agent;

class ChatService
{
    public function startChat($user, $hvacModelSlug)
    {
        $hvacModel = HvacModel::where('slug', $hvacModelSlug)->first();
        if (! $hvacModel) {
            throw new \Exception('HVAC model not found');
        }

        $chat = Chat::create([
            'user_id' => $user->id,
            'hvac_model_id' => $hvacModel->id,
            'title' => $hvacModel->name,
            'status' => 'active',
        ]);

        $chat->load('hvacModel');

        return new ChatResource($chat);
    }

    public function listChats($user, $request)
    {
        $query = Chat::with('latestMessage')
            ->where('user_id', $user->id)
            ->whereHas('messages');
        $perPage = $this->resolvePerPage($request, 15);

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

        return ChatResource::collection($query->latest('updated_at')->paginate($perPage));
    }

    public function sendMessage($user, $chatSlug, $request)
    {
        $chat = Chat::where('slug', $chatSlug)
            ->where('user_id', $user->id)
            ->first();
        if (! $chat) {
            throw new \Exception('Chat not found');
        }

        $chat = $this->normalizeAnalyzingState($chat, $chatSlug);

        if ($chat->status === 'limitHit') {
            throw new \Exception('Token limit reached for this chat.');
        }

        $statusWasUpdated = Chat::where('id', $chat->id)
            ->where('status', 'active')
            ->update(['status' => 'analyzing']);

        if ($statusWasUpdated === 0) {
            $chat->refresh();

            if ($chat->status === 'limitHit') {
                throw new \Exception('Token limit reached for this chat.');
            }

            throw new HttpException(429, 'Please wait until the current message is processed.');
        }

        try {
            $isFirstMessage = ! $chat->messages()->exists();

            $attachmentsData = [];
            if ($request->hasFile('files')) {
                foreach ($request->file('files') as $file) {
                    // Returns string like "communication/attachments/xxxx.png"
                    $path = Helper::uploadFile($file, 'communication/attachments', 'chat');

                    // Format matching Demo structure
                    $attachmentsData[] = [
                        'url' => $path,
                        'mimeType' => $file->getMimeType(),
                        'name' => $file->getClientOriginalName(),
                        'size' => $file->getSize(),
                    ];
                }
            }

            $content = $request->content;
            if (empty($content) && ! empty($attachmentsData)) {
                $content = 'attachments';
            }

            $message = ChatMessage::create([
                'chat_id' => $chat->id,
                'sender_id' => $user->id,
                'sender_role' => 'user',
                'content' => $content,
                'attachments' => empty($attachmentsData) ? null : $attachmentsData,
            ]);

            // Estimate token usage (e.g. 1 word ≈ 1.3 tokens, min 5 tokens)
            $wordCount = $request->content ? str_word_count($request->content) : 0;
            $messageTokens = max(5, (int) ($wordCount * 1.3));
            $chat->increment('tokens', $messageTokens);

            if ($chat->tokens >= 500) {
                $chat->update(['status' => 'limitHit']);
            }

            if ($isFirstMessage) {
                try {
                    $aiResponse = agent(
                        instructions: 'Generate a short, concise, and professional title (maximum 3-5 words) for a chat thread based on the user\'s first message. Do not include any quotes, markdown, or surrounding text. Keep it clean.'
                    )->prompt($message->content ?? 'New Chat');

                    $newTitle = trim($aiResponse->text);

                    if (! empty($newTitle)) {
                        $chat->update([
                            'title' => $newTitle,
                        ]);

                        broadcast(new ChatTitleUpdated($user->username, $chatSlug, $newTitle));
                    }
                } catch (\Exception $e) {
                    Log::error('Failed to generate chat title with AI: ' . $e->getMessage());
                }
            }

            // Real-time Status & AI Processing
            Cache::put("chat_{$chatSlug}_analyzing", true, now()->addMinutes(5));
            broadcast(new ChatStatusUpdated($user->username, $chatSlug, true));
            GenerateAiResponseJob::dispatch($chatSlug, $message->id);

            $message->load('chat');

            return new MessageResource($message);
        } catch (\Throwable $e) {
            Chat::where('id', $chat->id)
                ->where('status', 'analyzing')
                ->update(['status' => 'active']);

            Cache::forget("chat_{$chatSlug}_analyzing");
            broadcast(new ChatStatusUpdated($user->username, $chatSlug, false));

            throw $e;
        }
    }

    public function getMessages($user, $chatSlug, $request)
    {
        $chat = Chat::where('slug', $chatSlug)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $chat = $this->normalizeAnalyzingState($chat, $chatSlug);

        $perPage = $this->resolvePerPage($request, 20);

        if (! $chat) {
            throw new \Exception('Chat not found');
        }

        $messages = $chat->messages()->latest()->paginate($perPage);

        return [
            'messages' => MessageResource::collection($messages),
            'is_analyzing' => $chat->status === 'analyzing',
        ];
    }

    private function normalizeAnalyzingState(Chat $chat, string $chatSlug): Chat
    {
        if ($chat->status !== 'analyzing') {
            return $chat;
        }

        $latestMessage = $chat->messages()
            ->latest('id')
            ->first(['sender_role']);

        $hasAssistantReply = $latestMessage?->sender_role === 'assistant';
        $isStale = $chat->updated_at !== null && $chat->updated_at->lt(now()->subMinutes(5));

        if (! $hasAssistantReply && ! $isStale) {
            return $chat;
        }

        $nextStatus = $chat->tokens >= 500 ? 'limitHit' : 'active';

        $chat->update([
            'status' => $nextStatus,
        ]);

        Cache::forget("chat_{$chatSlug}_analyzing");

        return $chat->fresh() ?? $chat;
    }

    protected function resolvePerPage($request, int $default): int
    {
        $perPage = (int) $request->input('per_page', $default);

        if ($perPage < 1) {
            return $default;
        }

        return min($perPage, 100);
    }

    public function deleteChat($user, $chatSlug)
    {
        $chat = Chat::where('slug', $chatSlug)
            ->where('user_id', $user->id)
            ->first();
        if (! $chat) {
            throw new \Exception('Chat not found');
        }

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

    public function renameChat(mixed $user, string $chatSlug, string $title): ChatResource
    {
        $chat = Chat::where('slug', $chatSlug)
            ->where('user_id', $user->id)
            ->first();
        if (! $chat) {
            throw new \Exception('Chat not found');
        }

        $chat->update([
            'title' => $title,
        ]);

        $chat->load('hvacModel');

        broadcast(new ChatTitleUpdated($user->username, $chatSlug, $title));

        return new ChatResource($chat);
    }
}
