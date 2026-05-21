<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'system_name',
        'logo',
        'favicon',
    ];

    /**
     * @var list<string>
     */
    protected $appends = [
        'logo_url',
        'favicon_url',
    ];

    public static function current(): self
    {
        return static::query()->firstOrCreate([], [
            'system_name' => config('app.name', 'Laravel'),
        ]);
    }

    public function getLogoUrlAttribute(): ?string
    {
        return $this->fileUrl($this->logo);
    }

    public function getFaviconUrlAttribute(): ?string
    {
        return $this->fileUrl($this->favicon);
    }

    private function fileUrl(?string $path): ?string
    {
        if (empty($path)) {
            return null;
        }

        return asset('storage/'.ltrim($path, '/'));
    }
}
