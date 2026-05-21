<?php

namespace App\Http\Requests\Api\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSmtpSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['admin', 'super_admin', 'super-admin']) ?? false;
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

    public function messages(): array
    {
        return [
            'mail_mailer.required' => 'Mail mailer is required.',
            'mail_mailer.in' => 'Mail mailer must be one of: smtp, sendmail, mailgun, ses, log.',
            'mail_host.required' => 'Mail host is required.',
            'mail_port.required' => 'Mail port is required.',
            'mail_port.integer' => 'Mail port must be an integer.',
            'mail_port.min' => 'Mail port must be at least 1.',
            'mail_port.max' => 'Mail port cannot exceed 65535.',
            'mail_from_address.required' => 'Mail from address is required.',
            'mail_from_address.email' => 'Mail from address must be a valid email.',
            'mail_from_name.required' => 'Mail from name is required.',
            'mail_encryption.in' => 'Mail encryption must be either tls or ssl.',
        ];
    }
}
