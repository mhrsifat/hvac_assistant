<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Brand extends Model
{
    use HasFactory;

    protected $connection = 'mysql';

    protected $fillable = [
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
}
