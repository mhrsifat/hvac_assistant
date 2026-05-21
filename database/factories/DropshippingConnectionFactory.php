<?php

namespace Database\Factories;

use App\Models\DropshippingConnection;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DropshippingConnection>
 */
class DropshippingConnectionFactory extends Factory
{
    protected $model = DropshippingConnection::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'connected_by_user_id' => User::factory(),
            'provider_name' => fake()->randomElement(['aliexpress', 'cj_dropshipping', 'dhgate', 'spocket']),
            'credentials' => ['api_key' => fake()->sha1()],
            'is_connected' => true,
            'connected_at' => now(),
            'disconnected_at' => null,
            'last_synced_at' => now(),
            'last_error' => null,
        ];
    }
}
