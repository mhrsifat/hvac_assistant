<?php

namespace Modules\Legal\Models;

use Illuminate\Database\Eloquent\Model;

class StaticPage extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'type',
        'title',
        'slug',
        'status',
        'content',
    ];

    protected function casts(): array
    {
        return [
            'content' => 'array',
        ];
    }

    public static function forSlug(string $slug): self
    {
        return static::query()->firstOrCreate(
            ['slug' => $slug],
            [
                'type' => static::defaultTypeForSlug($slug),
                'title' => static::defaultTitleForSlug($slug),
                'status' => 'draft',
                'content' => [
                    'body' => '',
                ],
            ],
        );
    }

    private static function defaultTypeForSlug(string $slug): string
    {
        return match ($slug) {
            'privacy-policy' => 'privacy_policy',
            'terms-and-conditions' => 'terms_and_conditions',
            default => 'static_page',
        };
    }

    private static function defaultTitleForSlug(string $slug): string
    {
        return match ($slug) {
            'privacy-policy' => 'Privacy Policy',
            'terms-and-conditions' => 'Terms and Conditions',
            default => 'Static Page',
        };
    }
}
