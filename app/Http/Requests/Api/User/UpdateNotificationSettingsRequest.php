<?php

namespace App\Http\Requests\Api\User;

use App\Http\Requests\BaseRequest;

class UpdateNotificationSettingsRequest extends BaseRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'general_notification' => 'nullable|boolean',
            'sound' => 'nullable|boolean',
            'vibration' => 'nullable|boolean',
            'special_offer' => 'nullable|boolean',
            'payment' => 'nullable|boolean',
            'app_update' => 'nullable|boolean',
            'other' => 'nullable|boolean',
        ];
    }
}
