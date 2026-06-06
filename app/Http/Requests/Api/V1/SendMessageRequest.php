<?php

namespace App\Http\Requests\Api\V1;

use App\Concerns\ApiResponse;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class SendMessageRequest extends FormRequest
{
    use ApiResponse;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'content' => ['required_without:files', 'nullable', 'string'],
            'files' => ['nullable', 'array', 'max:5'], // Max 5 files per message
            'files.*' => [
                'file',
                'max:10240', // 10MB limit per file
                // Allow images, documents, and common formats based on route instructions
                'mimes:jpeg,png,jpg,gif,svg,webp,zip,gz,pdf,doc,docx,xls,xlsx,csv,txt,json,xml',
            ],
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException($this->errorResponse($validator->errors()->first(), 422, $validator->errors()->toArray()));
    }
}
