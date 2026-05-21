<?php

namespace App\Http\Requests\Api\Auth;

use App\Http\Requests\BaseRequest;
use Closure;
use Illuminate\Http\UploadedFile;

class SellerRegisterRequest extends BaseRequest
{
    protected function prepareForValidation(): void
    {
        $merge = [];

        $nidDocumentUrl = $this->input('nid_document_url');
        if (! $this->hasFile('nid_document_file') && is_string($nidDocumentUrl) && trim($nidDocumentUrl) !== '') {
            $merge['nid_document_file'] = trim($nidDocumentUrl);
        }

        $storeLogoUrl = $this->input('store_logo_url');
        if (! $this->hasFile('store_logo_file') && is_string($storeLogoUrl) && trim($storeLogoUrl) !== '') {
            $merge['store_logo_file'] = trim($storeLogoUrl);
        }

        $storeLogoUrl2 = $this->input('store_logo_url_2');
        if (! $this->hasFile('store_logo_file_2') && is_string($storeLogoUrl2) && trim($storeLogoUrl2) !== '') {
            $merge['store_logo_file_2'] = trim($storeLogoUrl2);
        }

        if ($merge !== []) {
            $this->merge($merge);
        }
    }

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|max:300|confirmed',
            'phone' => 'required|string|min:5|max:20|unique:users,phone',
            'terms_and_conditions' => 'required|boolean',

            'business_type' => 'required|string|in:Individual,Company',
            'company_name' => 'nullable|string|max:255|required_if:business_type,Company',
            'tax_id_or_reg_number' => 'nullable|string|max:100|required_if:business_type,Company',
            'industry_category' => 'required|string|max:100',
            'country' => 'required|string|max:100',
            'state' => 'required|string|max:100',
            'city' => 'required|string|max:100',
            'zip_code' => 'required|string|max:20',
            'address_line' => 'required|string',
            'nid_document_file' => ['required', $this->fileUploadOrPathRule()],

            'payout_method' => 'required|string|in:Bank_Transfer,Stripe',
            'stripe_account_id' => 'nullable|string|max:255|required_if:payout_method,Stripe',
            'account_holder_name' => 'required|string|max:255',
            'bank_name' => 'nullable|string|max:255|required_if:payout_method,Bank_Transfer',
            'account_number' => 'nullable|string|max:255|required_if:payout_method,Bank_Transfer',
            'swift_routing_code' => 'nullable|string|max:100|required_if:payout_method,Bank_Transfer',
            'payout_frequency' => 'required|string|in:Weekly,Monthly,On-demand',

            'store_name' => 'required|string|max:255|unique:stores,store_name',
            'store_description' => 'required|string',
            'store_logo_file' => ['required', $this->fileUploadOrPathRule()],
            'store_logo_file_2' => ['nullable', $this->fileUploadOrPathRule()],
            'contact_email' => 'required|string|email|max:255',
            'contact_phone' => 'required|string|max:50',
        ];
    }

    private function fileUploadOrPathRule(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail): void {
            if (is_string($value)) {
                if (trim($value) === '') {
                    $fail('The '.$attribute.' field must not be empty.');
                }

                return;
            }

            if ($value instanceof UploadedFile) {
                $mimeType = (string) $value->getMimeType();
                $isAllowedType = in_array($mimeType, ['image/jpeg', 'image/png', 'application/pdf'], true);
                $maxBytes = 2 * 1024 * 1024;

                if (! $isAllowedType) {
                    $fail('The '.$attribute.' must be a file of type: jpg, jpeg, png, pdf.');
                }

                if ($value->getSize() > $maxBytes) {
                    $fail('The '.$attribute.' must not be greater than 2048 kilobytes.');
                }

                return;
            }

            $fail('The '.$attribute.' must be an uploaded file or a non-empty file path.');
        };
    }

    public function messages(): array
    {
        return [
            'company_name.required_if' => 'Company name is required when business type is Company.',
            'tax_id_or_reg_number.required_if' => 'Tax ID/registration number is required when business type is Company.',
            'stripe_account_id.required_if' => 'Stripe account id is required when payout method is Stripe.',
            'bank_name.required_if' => 'Bank name is required when payout method is Bank Transfer.',
            'account_number.required_if' => 'Account number is required when payout method is Bank Transfer.',
        ];
    }
}
