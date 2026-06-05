<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Modules\Monetization\Models\Payment;
use Modules\Monetization\Models\Subscription;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements JWTSubject
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'username',
        'password',
        'phone',
        'country_name',
        'state',
        'city',
        'zip_code',
        'avatar',
        'email_verified_at',
        'terms_and_conditions',
        'status',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = [
        'name',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
        'stripe_customer_id',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'avatar' => 'string',
            'terms_and_conditions' => 'boolean',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    /**
     * Get the route key for the model.
     * This tells Laravel to use 'slug' instead of 'id' for route model binding.
     */
    public function getRouteKeyName(): string
    {
        return 'username';
    }

    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    /**
     * @return array<string, mixed>
     */
    public function getJWTCustomClaims(): array
    {
        return [];
    }

    public function getNameAttribute(): string
    {
        $firstName = (string) ($this->first_name ?? '');
        $lastName = (string) ($this->last_name ?? '');

        $fullName = trim($firstName.' '.$lastName);

        if ($fullName !== '') {
            return $fullName;
        }

        return (string) ($this->username ?? $this->email ?? '');
    }

    public function getAvatarAttribute(mixed $value): ?string
    {
        if (empty($value)) {
            return null;
        }

        return asset('storage/'.$value);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
