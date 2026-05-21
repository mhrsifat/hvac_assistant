<?php

namespace App\Http\Controllers\Api\Settings;

use App\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Admin\UpdateSmtpSettingsRequest;
use App\Http\Requests\Api\Settings\UpdateAiProviderApiKeyRequest;
use App\Services\Api\Settings\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Throwable;

class SettingsController extends Controller
{
    use ApiResponse;

    public function __construct(private SettingsService $settingsService) {}

    public function updateSmtpSettings(UpdateSmtpSettingsRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();

            $this->settingsService->updateSmtpSettings($validated);

            Log::info('SMTP settings updated', [
                'user_id' => auth('api')->id(),
                'mail_host' => $validated['mail_host'],
                'mail_from_address' => $validated['mail_from_address'],
            ]);

            return $this->success(200, 'SMTP settings updated successfully.');
        } catch (Throwable $e) {
            Log::error('Failed to update SMTP settings', [
                'user_id' => auth('api')->id(),
                'error' => $e->getMessage(),
            ]);

            return $this->error(500, 'Failed to update SMTP settings: '.$e->getMessage());
        }
    }

    public function getAvailableAiProviders(): JsonResponse
    {
        return $this->success(200, 'Available AI providers fetched successfully.', [
            'providers' => $this->settingsService->listAvailableAiProviders(),
        ]);
    }

    public function setAiProviderApiKey(UpdateAiProviderApiKeyRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();
            $isUpdated = $this->settingsService->setAiProviderApiKey(
                $validated['provider'],
                $validated['key']
            );

            if (! $isUpdated) {
                return $this->error(422, 'Selected AI provider is not supported.');
            }

            return $this->success(200, 'AI provider API key updated successfully.');
        } catch (Throwable $e) {
            Log::error('Failed to update AI provider API key', [
                'user_id' => auth('api')->id(),
                'error' => $e->getMessage(),
            ]);

            return $this->error(500, 'Failed to update AI provider API key: '.$e->getMessage());
        }
    }
}
