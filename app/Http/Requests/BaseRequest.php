<?php

namespace App\Http\Requests;

use App\Concerns\ApiResponse;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

abstract class BaseRequest extends FormRequest
{
    use ApiResponse;

    /**
     * Handle a failed validation attempt globally for all API requests.
     */
    protected function failedValidation(Validator $validator): void
    {
        $errors = $validator->errors();
        $message = $errors->any() ? $errors->first() : 'Validation failed';

        throw new HttpResponseException(
            $this->error(422, $message, $errors)
        );
    }
}
