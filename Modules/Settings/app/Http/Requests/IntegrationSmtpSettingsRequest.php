<?php

namespace Modules\Settings\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class IntegrationSmtpSettingsRequest extends FormRequest
{
  public function authorize(): bool
  {
    return $this->user()?->hasAnyRole(['admin', 'super-admin']) ?? false;
  }

  public function rules(): array
  {
    return [
      'mail_mailer' => ['required', 'string', 'in:smtp,sendmail,mailgun,ses,log'],
      'mail_host' => ['required', 'string', 'max:255'],
      'mail_port' => ['required', 'integer', 'min:1', 'max:65535'],
      'mail_username' => ['nullable', 'string', 'max:255'],
      'mail_password' => ['nullable', 'string', 'max:255'],
      'mail_from_address' => ['required', 'email', 'max:255'],
      'mail_from_name' => ['required', 'string', 'max:255'],
      'mail_encryption' => ['nullable', 'string', 'in:tls,ssl'],
    ];
  }
}
