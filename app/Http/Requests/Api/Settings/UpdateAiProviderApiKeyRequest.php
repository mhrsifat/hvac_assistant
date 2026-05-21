<?php

namespace App\Http\Requests\Api\Settings;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAiProviderApiKeyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['admin', 'super_admin']) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'provider' => ['required', 'string', 'in:openai,gemini'],
            'key' => ['required', 'string', 'max:5000'],
        ];
    }

    public function messages(): array
    {
        return [
            'provider.required' => 'AI provider is required.',
            'provider.in' => 'AI provider must be one of: openai, gemini.',
            'key.required' => 'API key is required.',
        ];
    }
}
