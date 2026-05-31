<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreBrandDocumentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'documents' => ['required', 'array', 'min:1'],
            'documents.*' => ['required', 'file', 'max:20480', 'mimes:pdf,docx,xlsx,csv,txt,jpg,jpeg,png,webp,gif'],
        ];
    }
    // custom messages for validation errors
    public function messages(): array
    {
        return [
            'documents.required' => 'Please upload at least one document.',
            'documents.*.required' => 'Please upload a document.',
            'documents.*.file' => 'The uploaded file must be a valid file.',
            'documents.*.max' => 'The document size must not exceed 20 MB.',
            'documents.*.mimes' => 'Unsupported file type. Allowed types: pdf, docx, xlsx, csv, txt, jpg, jpeg, png, webp, gif.',
        ];
    }
}
