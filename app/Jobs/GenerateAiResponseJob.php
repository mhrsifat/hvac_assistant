<?php

namespace App\Jobs;

use App\Ai\Agents\HvacAssistantAgent;
use App\Events\ChatStatusUpdated;
use App\Events\NewMessageReceived;
use App\Http\Resources\Api\V1\MessageResource;
use App\Models\Chat;
use App\Models\ChatMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Laravel\Ai\Files\Image;

class GenerateAiResponseJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 120; // AI might take time

    /**
     * Create a new job instance.
     */
    public function __construct(
        public string $chatSlug,
        public int $messageId
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $chat = Chat::where('slug', $this->chatSlug)->with('user')->first();
        if (! $chat) {
            return;
        }

        $username = (string) ($chat->user?->username ?? '');

        $userMessage = ChatMessage::find($this->messageId);
        if (! $userMessage) {
            $this->completeAnalyzing($chat, $username);

            return;
        }

        try {
            $agent = HvacAssistantAgent::make(user: $chat->user, chat: $chat);

            // Build attachments if they are images
            $aiAttachments = [];
            if ($userMessage->attachments && is_array($userMessage->attachments)) {
                foreach ($userMessage->attachments as $attachment) {
                    $attachmentUrl = is_array($attachment) ? ($attachment['url'] ?? '') : $attachment;
                    if (empty($attachmentUrl)) {
                        continue;
                    }

                    // Get relative path for Laravel AI SDK Storage
                    $parsedUrl = parse_url($attachmentUrl);
                    $relativePath = $parsedUrl['path'] ?? '';
                    $relativePath = preg_replace('/^\/?storage\//', '', $relativePath);

                    if (Storage::disk('public')->exists($relativePath)) {
                        // AI SDK expects Storage path relative to the disk configured, or full path.
                        // Assuming images for simplicity
                        if (preg_match('/\.(jpg|jpeg|png|webp|gif)$/i', $relativePath)) {
                            $aiAttachments[] = Image::fromPath(Storage::disk('public')->path($relativePath));
                        }
                    }
                }
            }

            // Generate Response
            if (! empty($aiAttachments)) {
                $response = $agent->prompt($userMessage->content ?? 'Analyze these attachments.', attachments: $aiAttachments);
            } else {
                $response = $agent->prompt($userMessage->content);
            }

            // Save new Message record
            $aiMessage = ChatMessage::create([
                'chat_id' => $chat->id,
                'sender_id' => null,
                'sender_role' => 'assistant',
                'content' => (string) $response,
                'attachments' => null,
            ]);

            // Estimate AI response tokens (e.g. 1 word ≈ 1.3 tokens, min 5 tokens)
            $aiWordCount = str_word_count((string) $response);
            $aiTokens = max(5, (int) ($aiWordCount * 1.3));
            $chat->increment('tokens', $aiTokens);

            if ($chat->tokens >= 500) {
                $chat->update(['status' => 'limitHit']);
            }

            // Load relation for resource
            $aiMessage->load('chat');
            $aiMessageResource = new MessageResource($aiMessage);

            // We resolve the resource to array because broadcast needs a primitive/array
            broadcast(new NewMessageReceived($username, $this->chatSlug, json_decode($aiMessageResource->toJson(), true)));
        } catch (\Exception $e) {
            Log::error('AI Response generation failed: ' . $e->getMessage());
        } finally {
            $this->completeAnalyzing($chat, $username);
        }
    }

    private function completeAnalyzing(Chat $chat, string $username): void
    {
        Chat::where('id', $chat->id)
            ->where('status', 'analyzing')
            ->update(['status' => 'active']);

        Cache::forget("chat_{$this->chatSlug}_analyzing");
        broadcast(new ChatStatusUpdated($username, $this->chatSlug, false));
    }
}
