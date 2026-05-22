<?php

namespace Modules\Settings\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Settings\Http\Requests\IntegrationAiSettingsRequest;
use Modules\Settings\Http\Requests\IntegrationSmtpSettingsRequest;
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

  public function updateAi(IntegrationAiSettingsRequest $request): RedirectResponse
  {
    $validated = $request->validated();

    $this->environmentSettingsService->setAiProviderApiKey(
      'openai',
      $validated['openai_api_key'],
    );

    return back()->with('success', 'OpenAI API key updated successfully.');
  }
}
