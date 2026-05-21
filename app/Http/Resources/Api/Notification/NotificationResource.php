<?php

namespace App\Http\Resources\Api\Notification;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title ?? 'New Notification',
            'type' => $this->type,
            'data' => is_string($this->data) ? json_decode($this->data, true) : $this->data,
            'is_read' => (bool) $this->is_read,
            'created_at' => $this->created_at ? $this->created_at->diffForHumans() : null,
        ];
    }
}
