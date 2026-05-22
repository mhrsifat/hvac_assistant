<?php

namespace App\Services;

use App\Models\ErrorCode;
use Illuminate\Support\Facades\Http;
use Modules\Vector\Services\VectorQueryService;

class AiChatService
{
  public function __construct(protected VectorQueryService $vectorQueryService) {}

  public function processMessage(string $message, ?int $hvacModelId = null): string
  {
    $errorCodes = ErrorCode::query()
      ->when($hvacModelId, function ($query) use ($hvacModelId): void {
        $query->where('hvac_model_id', $hvacModelId);
      })
      ->where(function ($query) use ($message): void {
        $query->where('code', 'like', '%' . $message . '%')
          ->orWhere('description', 'like', '%' . $message . '%');
      })
      ->get();

    $apiKey = (string) config('ai.providers.openai.key', '');

    if ($apiKey === '') {
      return $this->buildFallbackResponse($message, $errorCodes->toArray(), []);
    }

    $embeddingResponse = Http::withToken($apiKey)
      ->acceptJson()
      ->timeout(60)
      ->post('https://api.openai.com/v1/embeddings', [
        'model' => 'text-embedding-3-small',
        'input' => $message,
      ]);

    if ($embeddingResponse->failed()) {
      return $this->buildFallbackResponse($message, $errorCodes->toArray(), []);
    }

    $embedding = $embeddingResponse->json('data.0.embedding', []);
    $queryVector = '[' . implode(',', array_map(static fn($value): string => (string) $value, $embedding)) . ']';
    $vectorContext = $this->vectorQueryService->findSimilarContext($queryVector);

    $prompt = $this->buildPrompt($message, $errorCodes->toArray(), $vectorContext);

    $response = Http::withToken($apiKey)
      ->acceptJson()
      ->timeout(60)
      ->post('https://api.openai.com/v1/chat/completions', [
        'model' => 'gpt-4o-mini',
        'messages' => [
          [
            'role' => 'system',
            'content' => 'You are an expert HVAC technician AI assistant. Answer using only the provided context.',
          ],
          [
            'role' => 'user',
            'content' => $prompt,
          ],
        ],
      ]);

    return $response->json('choices.0.message.content') ?? $this->buildFallbackResponse($message, $errorCodes->toArray(), $vectorContext);
  }

  private function buildPrompt(string $message, array $errorCodes, array $vectorContext): string
  {
    return "User query: {$message}\n\nError Codes Context: " . json_encode($errorCodes) . "\n\nManual Context: " . json_encode($vectorContext);
  }

  private function buildFallbackResponse(string $message, array $errorCodes, array $vectorContext): string
  {
    return 'AI fallback response for: ' . $message . ' | Error codes: ' . json_encode($errorCodes) . ' | Vector context: ' . json_encode($vectorContext);
  }
}
