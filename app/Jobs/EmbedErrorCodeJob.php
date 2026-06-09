<?php

namespace App\Jobs;

use App\Models\ErrorCode;
use App\Services\Web\SupportDocumentService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class EmbedErrorCodeJob implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public ErrorCode $errorCode,
    ) {}

    /**
     * Execute the job.
     */
    public function handle(SupportDocumentService $service): void
    {
        try {
            $service->feedErrorCodeToAi($this->errorCode);
        } catch (Throwable $exception) {
            Log::error('Failed to embed error code to AI', [
                'error_code_id' => $this->errorCode->id,
                'error_message' => $exception->getMessage(),
                'error_type' => $exception::class,
            ]);
        }
    }
}
