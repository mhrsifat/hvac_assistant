<?php

namespace App\Concerns;

use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

trait ApiResponse
{
    /**
     * Returns a standardized success response.
     *
     * @param  int  $code  The HTTP status code.
     * @param  string|null  $message  An optional message.
     * @param  mixed  $data  The data to be included.
     */
    public function success($code = 200, $message = null, $data = []): JsonResponse
    {
        return response()->json([
            'success' => true,
            'code' => (int) $code,
            'message' => $message,
            'data' => $data,
            'timestamp' => now()->toIso8601String().' GMT'.now()->format('P'),
        ], $code);
    }

    /**
     * Returns a standardized error response.
     *
     * @param  int  $code  The HTTP status code.
     * @param  string|null  $message  An optional error message.
     * @param  mixed  $error  The error details.
     * @param  string|null  $redirectTo  The URL to redirect to.
     */
    public function error($code = 500, $message = null, $error = [], ?string $redirectTo = ''): JsonResponse
    {
        return response()->json([
            'success' => false,
            'code' => (int) $code,
            'message' => $message,
            'error' => $error,
            'redirectTo' => (string) $redirectTo ?? '',
            'timestamp' => now()->toIso8601String().' GMT'.now()->format('P'),
        ], $code);
    }

    private function validationError(ValidationException $exception): JsonResponse
    {
        $firstError = null;

        foreach ($exception->errors() as $messages) {
            if (is_array($messages) && isset($messages[0]) && is_string($messages[0])) {
                $firstError = $messages[0];
                break;
            }
        }

        return $this->error(422, $firstError ?? 'Validation failed.', $exception->errors());
    }
}
