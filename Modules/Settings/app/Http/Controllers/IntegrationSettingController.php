<?php

namespace Modules\Settings\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Settings\Http\Requests\IntegrationAiSettingsRequest;
use Modules\Settings\Http\Requests\IntegrationSmtpSettingsRequest;
use Modules\Settings\Http\Requests\IntegrationGoogleSettingsRequest;
use Modules\Settings\Http\Requests\IntegrationAppleSettingsRequest;
use Modules\Settings\Services\EnvironmentSettingsService;

class IntegrationSettingController extends Controller
{
  public function __construct(private EnvironmentSettingsService $environmentSettingsService) {}

  public function smtp(): Response
  {
    return Inertia::render('settings/integration/smtp', [
      'smtp' => [
        'mail_mailer' => config('mail.default', 'smtp'),
        'mail_host' => config('mail.mailers.smtp.host', ''),
        'mail_port' => (string) config('mail.mailers.smtp.port', 587),
        'mail_username' => config('mail.mailers.smtp.username', ''),
        'mail_password' => config('mail.mailers.smtp.password', ''),
        'mail_from_address' => config('mail.from.address', ''),
        'mail_from_name' => config('mail.from.name', ''),
        'mail_encryption' => config('mail.mailers.smtp.encryption', ''),
      ],
    ]);
  }

  public function updateSmtp(IntegrationSmtpSettingsRequest $request): RedirectResponse
  {
    $this->environmentSettingsService->updateSmtpSettings($request->validated());

    return back()->with('success', 'SMTP settings updated successfully.');
  }

  public function ai(): Response
  {
    return Inertia::render('settings/integration/ai', [
      'openAi' => [
        'configured' => filled(config('ai.providers.openai.key')),
      ],
    ]);
  }

  public function google(): Response
  {
    return Inertia::render('settings/integration/google', [
      'google' => [
        'google_play_package_name' => env('GOOGLE_PLAY_PACKAGE_NAME', ''),
        'google_application_credentials' => env('GOOGLE_APPLICATION_CREDENTIALS', ''),
      ],
    ]);
  }

  public function updateGoogle(IntegrationGoogleSettingsRequest $request): RedirectResponse
  {
    $validated = $request->validated();

    // If a service account JSON was uploaded, store it with the original filename
    if ($request->hasFile('GOOGLE_APPLICATION_CREDENTIALS_FILE')) {
      $file = $request->file('GOOGLE_APPLICATION_CREDENTIALS_FILE');
      $timestamp = time();
      $storagePath = storage_path('app/credentials/' . $timestamp);
      $filename = basename($file->getClientOriginalName());
      $filename = preg_replace('/[^A-Za-z0-9._-]/', '_', $filename);

      if ($filename === '') {
        $filename = 'google-app-credentials.json';
      }

      if (! file_exists($storagePath)) {
        mkdir($storagePath, 0755, true);
      }

      $file->move($storagePath, $filename);

      $envPath = str_replace('\\', '/', $storagePath . DIRECTORY_SEPARATOR . $filename);
      $this->environmentSettingsService->set('GOOGLE_APPLICATION_CREDENTIALS', $envPath);
    }

    // Update simple env keys
    if (array_key_exists('google_play_package_name', $validated)) {
      $value = $validated['google_play_package_name'];
      if (is_string($value)) {
        $value = trim(str_replace(["\r", "\n"], '', $value));
      }

      $this->environmentSettingsService->set('GOOGLE_PLAY_PACKAGE_NAME', $value);
    }

    return back()->with('success', 'Google integration settings updated successfully.');
  }

  public function updateAi(IntegrationAiSettingsRequest $request): RedirectResponse
  {
    $validated = $request->validated();

    $this->environmentSettingsService->setAiProviderApiKey(
      'openai',
      $validated['openai_api_key'],
    );

    return back()->with('success', 'OpenAI API key updated successfully.');
  }

  public function apple(): Response
  {
    return Inertia::render('settings/integration/apple', [
      'apple' => [
        'appstore_password' => env('APPSTORE_PASSWORD', ''),
        'apple_private_key_path' => env('APPLE_PRIVATE_KEY_PATH', ''),
      ],
    ]);
  }

  public function updateApple(IntegrationAppleSettingsRequest $request): RedirectResponse
  {
    $validated = $request->validated();

    // If an Apple private key file was uploaded, store it with the original filename
    if ($request->hasFile('APPLE_PRIVATE_KEY_FILE')) {
      $file = $request->file('APPLE_PRIVATE_KEY_FILE');
      $timestamp = time();
      $storagePath = storage_path('app/credentials/apple/' . $timestamp);
      $filename = basename($file->getClientOriginalName());
      $filename = preg_replace('/[^A-Za-z0-9._-]/', '_', $filename);

      if ($filename === '') {
        $filename = 'apple-private-key.p8';
      }

      if (! file_exists($storagePath)) {
        mkdir($storagePath, 0755, true);
      }

      $file->move($storagePath, $filename);

      $envPath = str_replace('\\', '/', $storagePath . DIRECTORY_SEPARATOR . $filename);
      $this->environmentSettingsService->set('APPLE_PRIVATE_KEY_PATH', $envPath);
    }

    if (array_key_exists('appstore_password', $validated)) {
      $value = $validated['appstore_password'];
      if (is_string($value)) {
        $value = trim(str_replace(["\r", "\n"], '', $value));
      }

      $this->environmentSettingsService->set('APPSTORE_PASSWORD', $value);
    }

    return back()->with('success', 'Apple integration settings updated successfully.');
  }
}
