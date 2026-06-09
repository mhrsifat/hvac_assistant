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

    protected static function booted(): void
    {
        static::deleting(function (ErrorCode $errorCode) {
            $errorCode->loadMissing(['brand', 'hvacModel']);
            
            $prefix = 'Brand: ' . $errorCode->brand->name . '. ';
            if ($errorCode->hvacModel) {
                $prefix .= 'Model: ' . $errorCode->hvacModel->name . ' (' . $errorCode->hvacModel->model_number . '). ';
            }
            
            $contentPrefix = $prefix . "Error Code: {$errorCode->code}.";
            
            // Escape special LIKE characters just in case
            $contentPrefix = str_replace(['\\', '%', '_'], ['\\\\', '\%', '\_'], $contentPrefix);

            \Illuminate\Support\Facades\DB::connection('pgsql_vector')
                ->table('manual_vectors')
                ->where('content', 'LIKE', $contentPrefix . '%')
                ->delete();
        });
    }
}
