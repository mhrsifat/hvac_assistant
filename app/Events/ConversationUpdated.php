<?php

namespace App\Events;

use App\Models\Chat;
use App\Models\ChatMessage;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ConversationUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Chat $chat,
        public ChatMessage $message,
    ) {}

    public function broadcastOn(): PrivateChannel
    {
        $username = (string) ($this->chat->user?->username ?? '');

        return new PrivateChannel('user.' . $username);
    }

    public function broadcastAs(): string
    {
        return 'ConversationUpdated';
    }

    public function broadcastWith(): array
    {
        return [
            'chat_id' => $this->chat->id,
            'chat_title' => $this->chat->title,
            'message_id' => $this->message->id,
            'sender_id' => $this->message->sender_id,
            'sender_role' => $this->message->sender_role,
            'content' => $this->message->content,
            'attachment_path' => $this->message->attachment_path,
            'created_at' => $this->message->created_at?->toIso8601String(),
        ];
    }
}
