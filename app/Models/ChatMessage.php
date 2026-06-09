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
    public function getAttachmentsAttribute($value): ?array
    {
        if (blank($value)) {
            return null;
        }

        $attachments = is_string($value) ? json_decode($value, true) : $value;

        if (! is_array($attachments)) {
            return null;
        }

        foreach ($attachments as $key => $attachment) {
            if (is_array($attachment)) {
                if (! empty($attachment['url'])) {
                    $attachments[$key]['url'] = $this->toAbsoluteAttachmentUrl($attachment['url']);
                }
            } else {
                $attachments[$key] = $this->toAbsoluteAttachmentUrl($attachment);
            }
        }

        return $attachments;
    }

    protected function toAbsoluteAttachmentUrl(string $pathOrUrl): string
    {
        if (filter_var($pathOrUrl, FILTER_VALIDATE_URL)) {
            return $pathOrUrl;
        }

        $path = str_starts_with($pathOrUrl, '/')
            ? $pathOrUrl
            : Storage::url($pathOrUrl);

        return url($path);
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
