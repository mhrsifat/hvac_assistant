<?php

namespace App\Services\Web;

use App\Helpers\Helper;
use App\Models\Brand;
use App\Models\ErrorCode;
use App\Models\HvacModel;
use App\Models\SupportDocument;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Laravel\Ai\Ai;
use PhpOffice\PhpSpreadsheet\IOFactory as SpreadsheetIOFactory;
use PhpOffice\PhpWord\IOFactory as WordIOFactory;
use RuntimeException;
use Smalot\PdfParser\Parser as PdfParser;

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

        $prefix = 'Brand: '.$brand->name.'. Document: '.$document->original_name.'. ';
        $chunks = array_map(
            static fn (string $chunk): string => $prefix.$chunk,
            $this->chunkText($cleanText, 1000, 200),
        );

        $this->storeEmbeddings($chunks);
    }

    public function feedModelDocumentToAi(HvacModel $model, SupportDocument $document): void
    {
        $rawText = $this->extractDocumentText($document);
        $cleanText = $this->sanitizeText($rawText);

        if ($cleanText === '') {
            throw new RuntimeException('No readable text found in the document.');
        }

        $model->loadMissing('brand');
        $prefix = 'Brand: '.$model->brand->name.'. Model: '.$model->name.' ('.$model->model_number.'). Document: '.$document->original_name.'. ';

        $chunks = array_map(
            static fn (string $chunk): string => $prefix.$chunk,
            $this->chunkText($cleanText, 1000, 200),
        );

        $this->storeEmbeddings($chunks);
    }

    public function feedErrorCodeToAi(ErrorCode $errorCode): void
    {
        $errorCode->loadMissing(['brand', 'hvacModel']);

        $prefix = 'Brand: '.$errorCode->brand->name.'. ';
        if ($errorCode->hvacModel) {
            $prefix .= 'Model: '.$errorCode->hvacModel->name.' ('.$errorCode->hvacModel->model_number.'). ';
        }

        $content = "Error Code: {$errorCode->code}. Description: {$errorCode->description}. Resolution Steps: {$errorCode->resolution_steps}.";

        $chunks = array_map(
            static fn (string $chunk): string => $prefix.$chunk,
            $this->chunkText($content, 1000, 200),
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
            'pdf' => $this->extractPdfText($path),
            'docx' => $this->extractDocxText($path),
            'xlsx', 'csv' => $this->extractSpreadsheetText($path),
            'txt' => (string) file_get_contents($path),
            default => throw new RuntimeException('Unsupported document type for AI feed.'),
        };
    }

    private function extractPdfText(string $path): string
    {
        $parser = new PdfParser;
        $pdf = $parser->parseFile($path);

        return $pdf->getText();
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
                $rowValues = array_values(array_filter($row, static fn ($value): bool => $value !== null && $value !== ''));

                if ($rowValues !== []) {
                    $rows[] = implode(' - ', $rowValues);
                }
            }
        }

        return implode("\n", $rows);
    }

    private function sanitizeText(string $text): string
    {
        // Strip invalid UTF-8 byte sequences to prevent json_encode failures in Guzzle.
        // mb_scrub() (PHP 8.4+) replaces invalid sequences with the Unicode replacement char (U+FFFD).
        // We then strip those replacement chars and any remaining non-UTF-8 bytes via iconv as a fallback.
        if (function_exists('mb_scrub')) {
            $text = mb_scrub($text, 'UTF-8');
        } else {
            // Fallback for older PHP: iconv strips bytes that can't be converted
            $text = (string) iconv('UTF-8', 'UTF-8//IGNORE', $text);
        }

        // Remove the Unicode replacement character (U+FFFD) left by mb_scrub
        $text = str_replace("\u{FFFD}", '', $text);

        // Collapse whitespace
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
        $length = mb_strlen($text, 'UTF-8');
        $offset = 0;

        while ($offset < $length) {
            $chunk = mb_substr($text, $offset, $chunkSize, 'UTF-8');

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
        $connection = DB::connection('pgsql_vector');

        $connection->transaction(function () use ($chunks, $connection): void {
            foreach ($chunks as $chunk) {
                // Final UTF-8 guard: ensure no bad bytes survive into the JSON payload
                $safeChunk = $this->sanitizeText($chunk);

                $embeddingsResponse = Ai::embeddings([$safeChunk]);
                $embedding = $embeddingsResponse->first();

                if (! is_array($embedding) || empty($embedding)) {
                    throw new RuntimeException('AI SDK embeddings response was empty.');
                }

                $vectorString = json_encode($embedding, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);

                $connection->insert(
                    'INSERT INTO manual_vectors (content, embedding) VALUES (?, ?::vector)',
                    [$safeChunk, $vectorString],
                );

                usleep(200000); // 200ms delay to prevent rate-limiting
            }
        });
    }
}
