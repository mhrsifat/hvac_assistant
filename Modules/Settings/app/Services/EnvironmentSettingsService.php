<?php

namespace Modules\Settings\Services;

use Illuminate\Support\Facades\Artisan;
use RuntimeException;
use Throwable;

class EnvironmentSettingsService
{
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
      if (! array_key_exists($requestKey, $validated)) {
        continue;
      }

      $updates[$envKey] = $this->normalizeValue($validated[$requestKey]);
    }

    $this->update($updates);
  }

  public function setAiProviderApiKey(string $provider, string $apiKey): bool
  {
    $providerMap = [
      'openai' => 'OPENAI_API_KEY',
      'gemini' => 'GEMINI_API_KEY',
    ];

    $normalizedProvider = strtolower(trim($provider));

    if (! isset($providerMap[$normalizedProvider])) {
      return false;
    }

    $this->set($providerMap[$normalizedProvider], $this->normalizeValue($apiKey));

    return true;
  }

  /**
   * @param  array<string, mixed>  $keyValuePairs
   */
  public function update(array $keyValuePairs, bool $clearConfig = true, bool $quoteAllStrings = true): void
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
      $envContent = $this->replaceOrAppendLine(
        $envContent,
        (string) $key,
        $value,
        $quoteAllStrings,
      );
    }

    if (file_put_contents($envPath, $envContent, LOCK_EX) === false) {
      throw new RuntimeException('Unable to write to .env file.');
    }

    if ($clearConfig) {
      $this->clearConfigCache();
    }
  }

  public function set(string $key, mixed $value, bool $clearConfig = true, bool $quoteAllStrings = true): void
  {
    $this->update([$key => $value], $clearConfig, $quoteAllStrings);
  }

  private function replaceOrAppendLine(
    string $envContent,
    string $key,
    mixed $value,
    bool $quoteAllStrings = true,
  ): string {
    $line = $this->buildEnvLine($key, $value, $quoteAllStrings);
    $pattern = '/^' . preg_quote($key, '/') . '=.*$/m';

    if (preg_match($pattern, $envContent) === 1) {
      $updatedEnvContent = preg_replace($pattern, $line, $envContent, 1);

      if ($updatedEnvContent === null) {
        throw new RuntimeException("Failed to update {$key} in .env file.");
      }

      return $updatedEnvContent;
    }

    $newline = $this->detectNewLine($envContent);
    $trimmedEnvContent = rtrim($envContent, "\r\n");

    if ($trimmedEnvContent === '') {
      return $line . $newline;
    }

    return $trimmedEnvContent . $newline . $line . $newline;
  }

  private function buildEnvLine(string $key, mixed $value, bool $quoteAllStrings = true): string
  {
    return $key . '=' . $this->formatValue($value, $quoteAllStrings);
  }

  private function formatValue(mixed $value, bool $quoteAllStrings = true): string
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

    $stringValue = (string) $value;

    if ($quoteAllStrings) {
      return $this->quoteString($stringValue);
    }

    if (preg_match('/^[A-Za-z0-9_\-.]+$/', $stringValue) === 1) {
      return $stringValue;
    }

    return $this->quoteString($stringValue);
  }

  private function quoteString(string $value): string
  {
    $escapedValue = str_replace(['\\', '"'], ['\\\\', '\\"'], $value);

    return '"' . $escapedValue . '"';
  }

  private function normalizeValue(mixed $value): mixed
  {
    if (! is_string($value)) {
      return $value;
    }

    return trim(str_replace(["\r", "\n"], '', $value));
  }

  private function readEnvContent(string $envPath): string
  {
    $envContent = file_get_contents($envPath);

    if ($envContent === false) {
      throw new RuntimeException('Unable to read .env file.');
    }

    return $envContent;
  }

  private function detectNewLine(string $envContent): string
  {
    return str_contains($envContent, "\r\n") ? "\r\n" : PHP_EOL;
  }

  private function clearConfigCache(): void
  {
    try {
      Artisan::call('optimize:clear');
      Artisan::call('queue:restart');
    } catch (Throwable) {
      // Ignore config cache failures so the file update still succeeds.
    }
  }
}
