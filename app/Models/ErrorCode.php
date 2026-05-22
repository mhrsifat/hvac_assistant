<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ErrorCode extends Model
{
    use HasFactory;

    protected $connection = 'mysql';

    protected $fillable = [
        'hvac_model_id',
        'code',
        'description',
        'resolution_steps',
    ];

    public function hvacModel(): BelongsTo
    {
        return $this->belongsTo(HvacModel::class);
    }
}
