<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class SupportDocument extends Model
{
    protected $connection = 'mysql';

    protected $fillable = [
        'brand_id',
        'hvac_model_id',
        'original_name',
        'file_path',
        'mime_type',
        'file_size',
        'is_processing',
        'ai_fed',
        'ai_feed_error',
    ];

    protected function casts(): array
    {
        return [
            'is_processing' => 'boolean',
            'ai_fed' => 'boolean',
            'ai_feed_error' => 'array',
        ];
    }

    public function getFilePathAttribute(?string $value): ?string
    {
        if (blank($value)) {
            return null;
        }

        return filter_var($value, FILTER_VALIDATE_URL)
            ? $value
            : Storage::url($value);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function hvacModel(): BelongsTo
    {
        return $this->belongsTo(HvacModel::class);
    }

    protected static function booted(): void
    {
        static::deleting(function (SupportDocument $document) {
            $document->loadMissing(['brand', 'hvacModel']);

            $prefix = '';
            if ($document->hvac_model_id && $document->hvacModel) {
                $prefix = 'Brand: '.$document->brand->name.'. Model: '.$document->hvacModel->name.' ('.$document->hvacModel->model_number.'). Document: '.$document->original_name.'. ';
            } elseif ($document->brand) {
                $prefix = 'Brand: '.$document->brand->name.'. Document: '.$document->original_name.'. ';
            }

            if ($prefix !== '') {
                // Escape special LIKE characters just in case
                $prefix = str_replace(['\\', '%', '_'], ['\\\\', '\%', '\_'], $prefix);

                DB::connection('pgsql_vector')
                    ->table('manual_vectors')
                    ->where('content', 'LIKE', $prefix.'%')
                    ->delete();
            }
        });
    }
}
