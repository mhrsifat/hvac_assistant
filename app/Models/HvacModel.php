<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class HvacModel extends Model
{
    use HasFactory;

    protected $connection = 'mysql';

    protected $fillable = [
        'brand_id',
        'name',
        'model_number',
        'capacity_btu',
        'efficiency_rating',
        'power_spec',
        'refrigerant_type',
        'image_path',
    ];

    // image_path accessor to return full URL
    public function getImagePathAttribute(?string $value): ?string
    {
        if (blank($value)) {
            return null;
        }

        return filter_var($value, FILTER_VALIDATE_URL)
            ? $value
            : Storage::url($value);
    }

    protected function casts(): array
    {
        return [
            'capacity_btu' => 'integer',
        ];
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function errorCodes(): HasMany
    {
        return $this->hasMany(ErrorCode::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(SupportDocument::class);
    }

    public function chats(): HasMany
    {
        return $this->hasMany(Chat::class);
    }
}
