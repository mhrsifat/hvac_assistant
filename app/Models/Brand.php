<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;
use NunoMaduro\LaravelSluggable\Attributes\Sluggable;

#[Sluggable(from: 'name')]
class Brand extends Model
{
    use HasFactory;

    protected $connection = 'mysql';

    protected $fillable = [
        'slug',
        'name',
        'logo_path',
    ];

    public function getLogoPathAttribute(?string $value): ?string
    {
        if (blank($value)) {
            return null;
        }

        return filter_var($value, FILTER_VALIDATE_URL)
            ? $value
            : Storage::url($value);
    }

    public function hvacModels(): HasMany
    {
        return $this->hasMany(HvacModel::class);
    }

    public function errorCodes(): HasMany
    {
        return $this->hasMany(ErrorCode::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(SupportDocument::class);
    }
}
