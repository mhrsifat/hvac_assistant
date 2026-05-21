<?php

namespace App\Services\Api\Settings;

use App\Services\Api\Env\GlobalEnvChangerService;

class SettingsService
{
    public function __construct(private GlobalEnvChangerService $globalEnvChangerService) {}

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
        $mapping = [
            'mail_mailer' => 'MAIL_MAILER',
            'mail_host' => 'MAIL_HOST',
            'mail_port' => 'MAIL_PORT',
            'mail_username' => 'MAIL_USERNAME',
            'mail_password' => 'MAIL_PASSWORD',
            'mail_from_address' => 'MAIL_FROM_ADDRESS',
            'mail_from_name' => 'MAIL_FROM_NAME',
            'mail_encryption' => 'MAIL_ENCRYPTION',
        ];

        $updates = [];

        foreach ($mapping as $requestKey => $envKey) {
            if (array_key_exists($requestKey, $validated)) {
                $updates[$envKey] = $this->sanitizeEnvValue($envKey, $validated[$requestKey]);
            }
        }

        if (empty($updates)) {
            return;
        }

        $this->globalEnvChangerService->update($updates);
    }

    private function sanitizeEnvValue(string $key, mixed $value): mixed
    {
        if (is_string($value)) {
            $value = trim($value);
            $value = str_replace(["\n", "\r", '"'], '', $value);
        }

        return $value;
    }

    /**
     * Set the API key for a given provider by updating the .env file
     */
    public function setAiProviderApiKey(string $provider, string $key): bool
    {
        $envMap = [
            'openai' => 'OPENAI_API_KEY',
            'gemini' => 'GEMINI_API_KEY',
        ];

        $normalizedProvider = strtolower(trim($provider));

        if (! isset($envMap[$normalizedProvider])) {
            return false;
        }

        $envKey = $envMap[$normalizedProvider];
        $this->globalEnvChangerService->set($envKey, $key);

        return true;
    }
}
