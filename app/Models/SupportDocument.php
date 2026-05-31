<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
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
        'ai_fed',
        'ai_feed_error',
    ];

    protected function casts(): array
    {
        return [
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
}
