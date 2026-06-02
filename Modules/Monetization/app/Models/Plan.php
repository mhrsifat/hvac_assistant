<?php

namespace Modules\Monetization\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Plan extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     * dont remove any commented out fields, they are for future use and will be added in the next few weeks
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'slug',
        // 'description',
        'final_price',
        // 'original_price',
        'currency',
        'apple_product_id',
        'google_product_id',
        // 'stripe_product_id',
        // 'stripe_price_id',
        'features',
        'billing_interval',
        'trial_days',
        'is_recommended',
        'status',
    ];

    /**
     * Get the route key for the model.
     * This tells Laravel to use 'slug' instead of 'id' for route model binding.
     */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'final_price' => 'decimal:2',
            'original_price' => 'decimal:2',
            'features' => 'array',
            'trial_days' => 'integer',
            'is_recommended' => 'boolean',
        ];
    }

    /**
     * Get the subscriptions associated with the plan.
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    /**
     * Get the payments associated with the plan.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
