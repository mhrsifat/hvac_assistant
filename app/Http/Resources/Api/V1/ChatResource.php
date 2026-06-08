<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'slug' => $this->slug,
            'title' => $this->title,
            'last_msg' => $this->relationLoaded('latestMessage')
                ? $this->latestMessage?->content
                : $this->messages()->latest()->first()?->content,
            'status' => $this->status,
            'date' => $this->created_at?->format('Y-m-d'),
        ];
    }
}
