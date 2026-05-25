<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ErrorCode extends Model
{
    protected $fillable = [
        'brand_id', // if brand_id is provided, it means the error code is specific to that brand (all models under that brand)
        'hvac_model_id', // if hvac_model_id is provided, it means the error code is specific to that model
        'code',
        'description',
        'resolution_steps',
    ];

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function hvacModel(): BelongsTo
    {
        return $this->belongsTo(HvacModel::class);
    }
}
