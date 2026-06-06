<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use NunoMaduro\LaravelSluggable\Attributes\Sluggable;

#[Sluggable(from: 'name')]
class Brand extends Model
{
    use HasFactory;

    protected static function booted(): void
    {
        static::creating(function (Brand $brand) {
            if (empty($brand->slug)) {
                $brand->slug = Str::slug($brand->name);
            }
        });
    }

    protected $connection = 'mysql';

    protected $fillable = [
        'slug',
        'name',
        'logo_path',
    ];

    protected function logoPath(): Attribute
    {
        return Attribute::make(
            get: function (?string $value, array $attributes) {
                if (blank($value)) {
                    $name = $attributes['name'] ?? 'NA';

                    $initials = collect(explode(' ', $name))
                        ->filter()
                        ->map(fn ($word) => strtoupper(substr($word, 0, 1)))
                        ->take(2)
                        ->implode('');

                    return "https://ui-avatars.com/api/?name={$initials}&background=4ECDC4&color=fff&size=256";
                }

                return filter_var($value, FILTER_VALIDATE_URL)
                    ? $value
                    : url(Storage::url($value));
            }
        );
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
