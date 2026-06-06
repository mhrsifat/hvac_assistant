<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use NunoMaduro\LaravelSluggable\Attributes\Sluggable;

#[Sluggable(from: 'name')]
class HvacModel extends Model
{
    use HasFactory;

    protected static function booted(): void
    {
        static::creating(function (HvacModel $model) {
            if (empty($model->slug)) {
                $model->slug = Str::slug($model->name);
            }
        });
    }

    protected $connection = 'mysql';

    protected $fillable = [
        'brand_id',
        'slug',
        'name',
        'model_number',
        'capacity_btu',
        'efficiency_rating',
        'power_spec',
        'refrigerant_type',
        'image_path',
    ];

    // image_path accessor to return full URL
    protected function imagePath(): Attribute
    {
        return Attribute::make(
            get: function (?string $value) {
                if (blank($value)) {
                    $name = $this->name ?? 'NA';

                    $initials = collect(explode(' ', $name))
                        ->filter()
                        ->map(fn ($word) => Str::upper(Str::substr($word, 0, 1)))
                        ->take(2)
                        ->implode('');

                    $colors = ['FF6B6B', '4ECDC4', '1A535C', 'FF9F1C', '2EC4B6'];

                    $color = $colors[array_rand($colors)];

                    return "https://ui-avatars.com/api/?name={$initials}&background={$color}&color=fff&size=256";
                }

                return filter_var($value, FILTER_VALIDATE_URL)
                    ? $value
                    : url(Storage::url($value));
            }
        );
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
