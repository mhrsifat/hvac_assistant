<?php

namespace App\Jobs;

use App\Models\Brand;
use App\Models\SupportDocument;
use App\Services\Web\SupportDocumentService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class FeedDocumentToAiJob implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public SupportDocument $document,
    ) {}

    /**
     * Execute the job.
     */
    public function handle(SupportDocumentService $service): void
    {
        try {
            if ($this->document->hvac_model_id) {
                $this->document->loadMissing('hvacModel.brand');
                $service->feedModelDocumentToAi($this->document->hvacModel, $this->document);
            } else {
                $this->document->loadMissing('brand');
                $service->feedBrandDocumentToAi($this->document->brand, $this->document);
            }
            
            $this->document->forceFill([
                'ai_fed' => true,
                'is_processing' => false,
                'ai_feed_error' => null,
            ])->save();
            
        } catch (Throwable $exception) {
            Log::error('Failed to feed document to AI', [
                'document_id' => $this->document->id,
                'error_message' => $exception->getMessage(),
                'error_type' => $exception::class,
            ]);

            $this->document->forceFill([
                'ai_fed' => false,
                'is_processing' => false,
                'ai_feed_error' => [
                    'message' => $exception->getMessage(),
                    'type' => $exception::class,
                ],
            ])->save();
        }
    }
}
