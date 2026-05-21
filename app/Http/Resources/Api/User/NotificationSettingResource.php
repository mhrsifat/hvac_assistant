<?php

namespace App\Http\Resources\Api\User;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationSettingResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'general_notification' => (bool) $this->general_notification,
            'sound' => (bool) $this->sound,
            'vibration' => (bool) $this->vibration,
            'special_offer' => (bool) $this->special_offer,
            'payment' => (bool) $this->payment,
            'app_update' => (bool) $this->app_update,
            'other' => (bool) $this->other,
        ];
    }
}
