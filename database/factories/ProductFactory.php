<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $providerName = fake()->randomElement(['aliexpress', 'cj_dropshipping', 'dhgate', 'spocket']);
        $basePrice = fake()->randomFloat(2, 5, 500);

        return [
            'seller_id' => User::factory(),
            'store_id' => null,
            'provider_name' => $providerName,
            'provider_product_id' => (string) fake()->unique()->numerify('product-#####'),
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'images' => ['https://example.com/images/product-default.jpg'],
            'currency' => 'USD',
            'base_price' => $basePrice,
            'markup_price' => 0,
            'provider_payload' => ['source' => $providerName],
            'last_synced_at' => now(),
            'is_active' => true,
        ];
    }
}
