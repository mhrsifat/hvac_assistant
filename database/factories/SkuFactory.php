<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Sku;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Sku>
 */
class SkuFactory extends Factory
{
    protected $model = Sku::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $basePrice = fake()->randomFloat(2, 5, 250);

        return [
            'product_id' => Product::factory(),
            'provider_sku_id' => (string) fake()->unique()->numerify('sku-#####'),
            'code' => fake()->unique()->bothify('SKU-####-??'),
            'attributes' => [
                'Color' => fake()->safeColorName(),
                'Size' => fake()->randomElement(['S', 'M', 'L', 'XL']),
                'Material' => fake()->word(),
            ],
            'images' => ['https://example.com/images/sku-default.jpg'],
            'base_price' => $basePrice,
            'markup_price' => 0,
            'inventory_count' => fake()->numberBetween(0, 500),
        ];
    }
}
