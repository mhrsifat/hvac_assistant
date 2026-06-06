<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use NunoMaduro\LaravelSluggable\Attributes\Sluggable;

#[Sluggable(from: 'title')]
class Chat extends Model
{
    use HasFactory;

    protected $connection = 'mysql';

    protected $fillable = [
        'user_id',
        'hvac_model_id',
        'slug',
        'title',
        'status',
    ];

    protected static function booted(): void
    {
        static::creating(function (Chat $chat) {
            if (empty($chat->slug)) {
                $chat->slug = Str::slug($chat->title).'-'.time();
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function hvacModel(): BelongsTo
    {
        return $this->belongsTo(HvacModel::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(ChatMessage::class);
    }

    public function repairReports(): HasMany
    {
        return $this->hasMany(RepairReport::class);
    }
}
