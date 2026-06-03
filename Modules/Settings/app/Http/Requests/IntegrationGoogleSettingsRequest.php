<?php

namespace Modules\Settings\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class IntegrationGoogleSettingsRequest extends FormRequest
{
  public function authorize(): bool
  {
    return $this->user()?->hasAnyRole(['admin', 'super-admin']) ?? false;
  }

  public function rules(): array
  {
    return [
      'google_play_package_name' => ['nullable', 'string', 'max:255'],
      'GOOGLE_APPLICATION_CREDENTIALS_FILE' => ['nullable', 'file', 'mimes:json'],
    ];
  }
}
