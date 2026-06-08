<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ChatMessage extends Model
{
    use HasFactory;

    protected $connection = 'mysql';

    protected $touches = ['chat'];

    protected $fillable = [
        'chat_id',
        'sender_id',
        'sender_role',
        'content',
        'attachments',
    ];

    protected function casts(): array
    {
        return [
            'attachments' => 'array',
        ];
    }

    // accessor to return attachments as full URLs
    public function getAttachmentsAttribute(?string $value): ?array
    {
        if (blank($value)) {
            return null;
        }
        $attachments = json_decode($value, true);

        if (! is_array($attachments)) {
            return null;
        }

        foreach ($attachments as $key => $attachment) {
            if (is_array($attachment)) {
                if (isset($attachment['url'])) {
                    $url = $attachment['url'];
                    $attachments[$key]['url'] = filter_var($url, FILTER_VALIDATE_URL)
                        ? $url
                        : Storage::url($url);
                }
            } else {
                $attachments[$key] = filter_var($attachment, FILTER_VALIDATE_URL)
                    ? $attachment
                    : Storage::url($attachment);
            }
        }

        return $attachments;
    }

    public function chat(): BelongsTo
    {
        return $this->belongsTo(Chat::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
