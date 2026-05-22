<?php

namespace Modules\Settings\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class IntegrationAiSettingsRequest extends FormRequest
{
  public function authorize(): bool
  {
    return $this->user()?->hasAnyRole(['admin', 'super-admin']) ?? false;
  }

  public function rules(): array
  {
    return [
      'openai_api_key' => ['required', 'string', 'max:255'],
    ];
  }
}
