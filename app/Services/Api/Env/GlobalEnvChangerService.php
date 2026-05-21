<?php

namespace App\Services\Api\Env;

use Illuminate\Support\Facades\Artisan;
use RuntimeException;
use Throwable;

class GlobalEnvChangerService
{
    /**
     * @param  array<string, mixed>  $keyValuePairs
     */
    public function update(array $keyValuePairs, bool $clearConfig = true, bool $quoteAllStrings = false): void
    {
        if ($keyValuePairs === []) {
            return;
        }

        $envPath = base_path('.env');

        if (! file_exists($envPath)) {
            throw new RuntimeException('.env file not found.');
        }

        $envContent = $this->readEnvContent($envPath);

        foreach ($keyValuePairs as $key => $value) {
            $line = $this->buildEnvLine((string) $key, $value, $quoteAllStrings);
            $pattern = '/^'.preg_quote((string) $key, '/').'=.*$/m';

            if (preg_match($pattern, $envContent) === 1) {
                $updatedEnvContent = preg_replace($pattern, $line, $envContent);

                if ($updatedEnvContent === null) {
                    throw new RuntimeException("Failed to update {$key} in .env file.");
                }

                $envContent = $updatedEnvContent;

                continue;
            }

            $envContent = rtrim($envContent).PHP_EOL.$line.PHP_EOL;
        }

        if (file_put_contents($envPath, $envContent) === false) {
            throw new RuntimeException('Unable to write to .env file.');
        }

        if ($clearConfig) {
            $this->clearConfigCache();
        }
    }

    public function set(string $key, mixed $value, bool $clearConfig = true, bool $quoteAllStrings = false): void
    {
        $this->update([$key => $value], $clearConfig, $quoteAllStrings);
    }

    /**
     * @param  array<int, string>  $keys
     */
    public function normalizeQuotedKeys(array $keys, bool $clearConfig = true): void
    {
        if ($keys === []) {
            return;
        }

        $envPath = base_path('.env');

        if (! file_exists($envPath)) {
            throw new RuntimeException('.env file not found.');
        }

        $envContent = $this->readEnvContent($envPath);
        $updates = [];

        foreach ($keys as $key) {
            $rawValue = $this->extractRawValue($envContent, $key);

            if ($rawValue === null) {
                continue;
            }

            $updates[$key] = $this->normalizeRawValueToString($rawValue);
        }

        if ($updates === []) {
            return;
        }

        $this->update($updates, $clearConfig);
    }

    private function buildEnvLine(string $key, mixed $value, bool $quoteAllStrings = false): string
    {
        return $key.'='.$this->formatValue($value, $quoteAllStrings);
    }

    private function formatValue(mixed $value, bool $quoteAllStrings = false): string
    {
        if (is_bool($value)) {
            return $value ? 'true' : 'false';
        }

        if ($value === null) {
            return 'null';
        }

        if (is_int($value) || is_float($value)) {
            return (string) $value;
        }

        $stringValue = trim((string) $value);

        if ($quoteAllStrings) {
            $escapedValue = str_replace(['\\', '"'], ['\\\\', '\\"'], $stringValue);

            return "\"{$escapedValue}\"";
        }

        // If safe (no spaces, no special chars), don't quote
        if (preg_match('/^[A-Za-z0-9_\-\.]+$/', $stringValue)) {
            return $stringValue;
        }

        // Otherwise quote and escape properly
        $escapedValue = str_replace(['\\', '"'], ['\\\\', '\\"'], $stringValue);

        return "\"{$escapedValue}\"";
    }

    private function readEnvContent(string $envPath): string
    {
        $envContent = file_get_contents($envPath);

        if ($envContent === false) {
            throw new RuntimeException('Unable to read .env file.');
        }

        return $envContent;
    }

    private function extractRawValue(string $envContent, string $key): ?string
    {
        $pattern = '/^'.preg_quote($key, '/').'=(.*)$/m';

        if (preg_match($pattern, $envContent, $matches) !== 1) {
            return null;
        }

        return $matches[1];
    }

    private function normalizeRawValueToString(string $rawValue): string
    {
        $trimmed = trim($rawValue);

        if ($trimmed === '') {
            return '';
        }

        if (str_starts_with($trimmed, '"') && str_ends_with($trimmed, '"')) {
            $inner = substr($trimmed, 1, -1);

            return str_replace(['\\"', '\\\\'], ['"', '\\'], $inner);
        }

        if (str_starts_with($trimmed, "'") && str_ends_with($trimmed, "'")) {
            return substr($trimmed, 1, -1);
        }

        return $trimmed;
    }

    private function clearConfigCache(): void
    {
        try {
            Artisan::call('config:clear');
        } catch (Throwable) {
            // Ignore failures; updated values will still apply on next reload.
        }
    }
}
