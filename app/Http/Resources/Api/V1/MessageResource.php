<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Cache;

class MessageResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        // For type checking, assume it's 'attachment' if there are attachments, otherwise 'text'
        $type = blank($this->attachments) ? 'text' : 'attachment';

        $chatSlug = $this->relationLoaded('chat') && $this->chat ? $this->chat->slug : null;

        return [
            'id' => (string) $this->id,
            'sender_role' => $this->sender_role,
            'is_analyzing' => $chatSlug ? Cache::get("chat_{$chatSlug}_analyzing", false) : false,
            'type' => $type,
            'content' => $this->content,
            'attachments' => $this->attachments, // Extracted securely via ChatMessage accessor
            'status' => 'sent', // Constant for now as per demo, could be dynamic later
            'created_at' => $this->created_at,
        ];
    }
}
