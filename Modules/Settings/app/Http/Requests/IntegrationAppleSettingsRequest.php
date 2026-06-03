<?php

namespace Modules\Settings\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class IntegrationAppleSettingsRequest extends FormRequest
{
  public function authorize(): bool
  {
    return $this->user()?->hasAnyRole(['admin', 'super-admin']) ?? false;
  }

  public function rules(): array
  {
    return [
      // allow uploading the private key using field name 'APPLE_PRIVATE_KEY_FILE'
      'APPLE_PRIVATE_KEY_FILE' => ['nullable', 'file', 'mimetypes:text/plain,application/octet-stream'],
      'appstore_password' => ['nullable', 'string', 'max:2000'],
    ];
  }
}
