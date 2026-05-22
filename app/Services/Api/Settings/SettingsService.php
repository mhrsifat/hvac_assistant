<?php

namespace App\Services\Api\Settings;

use Modules\Settings\Services\EnvironmentSettingsService;

class SettingsService
{
    public function __construct(private EnvironmentSettingsService $environmentSettingsService) {}

    /**
     * List available AI providers (static for now: openai, gemini)
     */
    public function listAvailableAiProviders(): array
    {
        return [
            [
                'name' => 'openai',
                'label' => 'OpenAI',
            ],
            [
                'name' => 'gemini',
                'label' => 'Gemini',
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    public function updateSmtpSettings(array $validated): void
    {
        $this->environmentSettingsService->updateSmtpSettings($validated);
    }

    /**
     * Set the API key for a given provider by updating the .env file
     */
    public function setAiProviderApiKey(string $provider, string $key): bool
    {
        return $this->environmentSettingsService->setAiProviderApiKey($provider, $key);
    }
}
