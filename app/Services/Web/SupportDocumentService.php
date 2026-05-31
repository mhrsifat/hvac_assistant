<?php

namespace App\Services\Web;

use App\Helpers\Helper;
use App\Models\Brand;
use App\Models\HvacModel;
use App\Models\SupportDocument;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\IOFactory as SpreadsheetIOFactory;
use PhpOffice\PhpWord\IOFactory as WordIOFactory;
use RuntimeException;
use Spatie\PdfToText\Pdf;

class SupportDocumentService
{
    public function createForBrand(Brand $brand, UploadedFile $file): SupportDocument
    {
        $path = Helper::uploadFile($file, 'brands/documents', 'file');

        return SupportDocument::create([
            'brand_id' => $brand->id,
            'hvac_model_id' => null,
            'original_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'mime_type' => $file->getClientMimeType() ?? $file->getMimeType() ?? 'application/octet-stream',
            'file_size' => $file->getSize() ?? 0,
            'ai_fed' => false,
            'ai_feed_error' => null,
        ]);
    }

    public function createForModel(HvacModel $hvacModel, UploadedFile $file): SupportDocument
    {
        $path = Helper::uploadFile($file, 'hvac-models/documents', 'file');

        return SupportDocument::create([
            'brand_id' => $hvacModel->brand_id,
            'hvac_model_id' => $hvacModel->id,
            'original_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'mime_type' => $file->getClientMimeType() ?? $file->getMimeType() ?? 'application/octet-stream',
            'file_size' => $file->getSize() ?? 0,
            'ai_fed' => false,
            'ai_feed_error' => null,
        ]);
    }

    public function feedBrandDocumentToAi(Brand $brand, SupportDocument $document): void
    {
        $rawText = $this->extractDocumentText($document);
        $cleanText = $this->sanitizeText($rawText);

        if ($cleanText === '') {
            throw new RuntimeException('No readable text found in the document.');
        }

        $prefix = 'Brand: ' . $brand->name . '. Document: ' . $document->original_name . '. ';
        $chunks = array_map(
            static fn(string $chunk): string => $prefix . $chunk,
            $this->chunkText($cleanText, 1000, 200),
        );

        $this->storeEmbeddings($chunks);
    }

    public function delete(SupportDocument $document): void
    {
        $this->deleteStoredFile($document->getRawOriginal('file_path'));
        $document->delete();
    }

    private function deleteStoredFile(?string $path): void
    {
        if (blank($path)) {
            return;
        }

        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }

    private function extractDocumentText(SupportDocument $document): string
    {
        $relativePath = $document->getRawOriginal('file_path');

        if (blank($relativePath)) {
            throw new RuntimeException('Document path is missing.');
        }

        $disk = Storage::disk('public');

        if (! $disk->exists($relativePath)) {
            throw new RuntimeException('Document file not found.');
        }

        $path = $disk->path($relativePath);
        $extension = strtolower((string) pathinfo($path, PATHINFO_EXTENSION));

        return match ($extension) {
            'pdf' => Pdf::getText($path),
            'docx' => $this->extractDocxText($path),
            'xlsx', 'csv' => $this->extractSpreadsheetText($path),
            'txt' => (string) file_get_contents($path),
            default => throw new RuntimeException('Unsupported document type for AI feed.'),
        };
    }

    private function extractDocxText(string $path): string
    {
        $document = WordIOFactory::load($path);
        $parts = [];

        foreach ($document->getSections() as $section) {
            foreach ($section->getElements() as $element) {
                $parts[] = $this->extractWordElementText($element);
            }
        }

        return trim(implode(' ', array_filter($parts)));
    }

    private function extractWordElementText($element): string
    {
        if (is_object($element) && method_exists($element, 'getText')) {
            return (string) $element->getText();
        }

        if (is_object($element) && method_exists($element, 'getElements')) {
            $parts = [];

            foreach ($element->getElements() as $child) {
                $parts[] = $this->extractWordElementText($child);
            }

            return trim(implode(' ', array_filter($parts)));
        }

        return '';
    }

    private function extractSpreadsheetText(string $path): string
    {
        $spreadsheet = SpreadsheetIOFactory::load($path);
        $rows = [];

        foreach ($spreadsheet->getAllSheets() as $sheet) {
            foreach ($sheet->toArray(null, true, true, true) as $row) {
                $rowValues = array_values(array_filter($row, static fn($value): bool => $value !== null && $value !== ''));

                if ($rowValues !== []) {
                    $rows[] = implode(' - ', $rowValues);
                }
            }
        }

        return implode("\n", $rows);
    }

    private function sanitizeText(string $text): string
    {
        $cleaned = preg_replace('/\s+/', ' ', $text) ?? '';

        return trim($cleaned);
    }

    /**
     * @return array<int, string>
     */
    private function chunkText(string $text, int $chunkSize, int $overlap): array
    {
        if ($chunkSize <= $overlap) {
            $overlap = 0;
        }

        $chunks = [];
        $length = strlen($text);
        $offset = 0;

        while ($offset < $length) {
            $chunk = substr($text, $offset, $chunkSize);

            if (trim($chunk) !== '') {
                $chunks[] = $chunk;
            }

            $offset += $chunkSize - $overlap;
        }

        return $chunks;
    }

    /**
     * @param  array<int, string>  $chunks
     */
    private function storeEmbeddings(array $chunks): void
    {
        $apiKey = (string) config('ai.providers.openai.key', '');

        if ($apiKey === '') {
            throw new RuntimeException('OpenAI API key is not configured.');
        }

        $connection = DB::connection('pgsql_vector');

        $connection->transaction(function () use ($chunks, $apiKey, $connection): void {
            foreach ($chunks as $chunk) {
                $embeddingResponse = Http::withToken($apiKey)
                    ->acceptJson()
                    ->timeout(60)
                    ->post('https://api.openai.com/v1/embeddings', [
                        // Ensure your model here matches the dimension size in your migration
                        'model' => 'text-embedding-3-small',
                        'input' => $chunk,
                    ]);

                if ($embeddingResponse->failed()) {
                    $message = (string) $embeddingResponse->json('error.message', 'OpenAI embeddings request failed.');

                    throw new RuntimeException($message);
                }

                $embedding = $embeddingResponse->json('data.0.embedding', []);

                if (! is_array($embedding) || $embedding === []) {
                    throw new RuntimeException('OpenAI embeddings response was empty.');
                }

                // Use json_encode to perfectly format the array as a string: "[0.123, -0.456, ...]"
                $vectorString = json_encode($embedding);

                // FIX: Use PostgreSQL pgvector syntax (?::vector) instead of TO_VECTOR(?)
                $connection->insert(
                    'INSERT INTO manual_vectors (content, embedding) VALUES (?, ?::vector)',
                    [$chunk, $vectorString],
                );

                usleep(200000);
            }
        });
    }
}
