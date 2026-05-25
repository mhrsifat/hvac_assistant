<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class RepairReport extends Model
{
    use HasFactory;

    protected $connection = 'mysql';

    protected $fillable = [
        'user_id',
        'chat_id',
        'title',
        'location',
        'status',
        'pdf_path',
    ];

    // pdf_path accessor to return full URL
    public function getPdfPathAttribute(?string $value): ?string
    {
        if (blank($value)) {
            return null;
        }

        return filter_var($value, FILTER_VALIDATE_URL)
            ? $value
            : Storage::url($value);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function chat(): BelongsTo
    {
        return $this->belongsTo(Chat::class);
    }
}
