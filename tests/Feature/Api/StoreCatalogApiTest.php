<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\Sku;
use App\Models\User;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;

test('public can fetch store home and category tree payload', function () {
    $rootCategory = Category::query()->create([
        'title' => 'Electronics',
        'sort_order' => 0,
        'is_active' => true,
    ]);

    Category::query()->create([
        'parent_id' => $rootCategory->id,
        'title' => 'Smartphones',
        'sort_order' => 1,
        'is_active' => true,
    ]);

    $product = Product::factory()->create([
        'title' => 'Galaxy S25 Ultra',
        'brand' => 'Samsung',
        'is_featured' => true,
        'is_active' => true,
    ]);

    $product->categories()->attach($rootCategory->id, ['is_primary' => true]);

    Sku::factory()->create([
        'product_id' => $product->id,
        'inventory_count' => 25,
        'is_active' => true,
    ]);

    $homeResponse = getJson('/api/store/home');

    $homeResponse
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.featured_categories.0.title', 'Electronics')
        ->assertJsonPath('data.featured_products.0.title', 'Galaxy S25 Ultra');

    $treeResponse = getJson('/api/store/categories/tree');

    $treeResponse
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.categories.0.title', 'Electronics')
        ->assertJsonPath('data.categories.0.children.0.title', 'Smartphones');
});

test('public can filter products by category brand and price', function () {
    $category = Category::query()->create([
        'title' => 'Audio',
        'sort_order' => 0,
        'is_active' => true,
    ]);

    $matchProduct = Product::factory()->create([
        'title' => 'Wireless Earbuds A',
        'brand' => 'BrandA',
        'base_price' => 120,
        'markup_price' => 0,
        'is_active' => true,
    ]);

    $otherProduct = Product::factory()->create([
        'title' => 'Wireless Earbuds B',
        'brand' => 'BrandB',
        'base_price' => 350,
        'markup_price' => 0,
        'is_active' => true,
    ]);

    $matchProduct->categories()->attach($category->id, ['is_primary' => true]);
    $otherProduct->categories()->attach($category->id, ['is_primary' => true]);

    Sku::factory()->create([
        'product_id' => $matchProduct->id,
        'inventory_count' => 10,
        'is_active' => true,
    ]);
    Sku::factory()->create([
        'product_id' => $otherProduct->id,
        'inventory_count' => 10,
        'is_active' => true,
    ]);

    $response = getJson('/api/store/categories/'.$category->id.'/products?brand=BrandA&min_price=100&max_price=200&in_stock=true');

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonCount(1, 'data.products')
        ->assertJsonPath('data.products.0.brand', 'BrandA');
});

test('public can fetch products by category slug', function () {
    $category = Category::query()->create([
        'title' => 'High-end Audio',
        'slug' => 'high-end-audio',
        'sort_order' => 0,
        'is_active' => true,
    ]);

    $product = Product::factory()->create([
        'title' => 'Premium Headphones',
        'brand' => 'BrandA',
        'base_price' => 200,
        'markup_price' => 0,
        'is_active' => true,
    ]);

    $product->categories()->attach($category->id, ['is_primary' => true]);

    Sku::factory()->create([
        'product_id' => $product->id,
        'inventory_count' => 10,
        'is_active' => true,
    ]);

    $response = getJson('/api/store/categories/'.$category->slug.'/products');

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonCount(1, 'data.products')
        ->assertJsonPath('data.products.0.title', 'Premium Headphones');
});

test('authenticated user can submit a review and see updated summary', function () {
    $product = Product::factory()->create([
        'title' => 'Motorola G15',
        'is_active' => true,
    ]);

    Sku::factory()->create([
        'product_id' => $product->id,
        'inventory_count' => 14,
        'is_active' => true,
    ]);

    /** @var User $user */
    $user = User::factory()->create();

    actingAs($user, 'api');

    $submitResponse = postJson('/api/store/products/'.$product->id.'/reviews', [
        'rating' => 5,
        'title' => 'Excellent phone',
        'comment' => 'Performance and camera are excellent.',
    ]);

    $submitResponse
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.review_summary.average', 5)
        ->assertJsonPath('data.review_summary.total', 1);

    $listResponse = getJson('/api/store/products/'.$product->id.'/reviews');

    $listResponse
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonCount(1, 'data.reviews')
        ->assertJsonPath('data.summary.average', 5);

    $product->refresh();
    expect((float) $product->rating_average)->toBe(5.0);
    expect((int) $product->rating_count)->toBe(1);
});

test('public can fetch store product details by slug', function () {
    $parentCategory = Category::query()->create([
        'title' => 'Accessories',
        'slug' => 'accessories',
        'sort_order' => 0,
        'is_active' => true,
    ]);

    $childCategory = Category::query()->create([
        'parent_id' => $parentCategory->id,
        'title' => 'Phone Accessories',
        'slug' => 'phone-accessories',
        'sort_order' => 1,
        'is_active' => true,
    ]);

    $product = Product::factory()->create([
        'title' => 'OnePlus Nord 4',
        'is_active' => true,
    ]);

    $product->categories()->attach($childCategory->id, ['is_primary' => true]);

    Sku::factory()->create([
        'product_id' => $product->id,
        'inventory_count' => 10,
        'is_active' => true,
    ]);

    $product->refresh();

    $response = getJson('/api/store/products/'.$product->slug);

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.product.slug', $product->slug)
        ->assertJsonPath('data.product.title', 'OnePlus Nord 4')
        ->assertJsonPath('data.product.categories.0.title', 'Accessories')
        ->assertJsonPath('data.product.categories.0.slug', 'accessories')
        ->assertJsonPath('data.product.categories.0.children.0.title', 'Phone Accessories')
        ->assertJsonPath('data.product.categories.0.children.0.slug', 'phone-accessories');
});
test('public can fetch product description and specification by slug', function () {
    $product = Product::factory()->create([
        'title' => 'Description Phone',
        'description' => 'A test phone description.',
        'specification' => [
            'screen' => '6.5 inch',
            'battery' => '4500mAh',
        ],
        'is_active' => true,
    ]);

    $product->refresh();

    $response = getJson('/api/store/products/'.$product->slug.'/description');

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.product.slug', $product->slug)
        ->assertJsonPath('data.product.description', 'A test phone description.')
        ->assertJsonPath('data.product.specification.screen', '6.5 inch')
        ->assertJsonPath('data.product.specification.battery', '4500mAh');
});

test('public can fetch similar products by slug', function () {
    $category = Category::query()->create([
        'title' => 'Phones',
        'slug' => 'phones',
        'sort_order' => 0,
        'is_active' => true,
    ]);

    $targetProduct = Product::factory()->create([
        'title' => 'Target Phone',
        'brand' => 'BrandX',
        'slug' => 'target-phone',
        'is_active' => true,
    ]);

    $categoryMatch = Product::factory()->create([
        'title' => 'Category Match',
        'brand' => 'OtherBrand',
        'slug' => 'category-match',
        'is_active' => true,
    ]);

    $brandMatch = Product::factory()->create([
        'title' => 'Brand Match',
        'brand' => 'BrandX',
        'slug' => 'brand-match',
        'is_active' => true,
    ]);

    $unrelatedProduct = Product::factory()->create([
        'title' => 'Unrelated Product',
        'brand' => 'AnotherBrand',
        'slug' => 'unrelated-product',
        'is_active' => true,
    ]);

    $targetProduct->categories()->attach($category->id, ['is_primary' => true]);
    $categoryMatch->categories()->attach($category->id, ['is_primary' => true]);

    Sku::factory()->create([
        'product_id' => $targetProduct->id,
        'inventory_count' => 5,
        'is_active' => true,
    ]);

    Sku::factory()->create([
        'product_id' => $categoryMatch->id,
        'inventory_count' => 8,
        'is_active' => true,
    ]);

    Sku::factory()->create([
        'product_id' => $brandMatch->id,
        'inventory_count' => 3,
        'is_active' => true,
    ]);

    Sku::factory()->create([
        'product_id' => $unrelatedProduct->id,
        'inventory_count' => 12,
        'is_active' => true,
    ]);

    $response = getJson('/api/store/products/'.$targetProduct->slug.'/similar');

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.product.slug', 'target-phone')
        ->assertJsonPath('data.similar_products.0.slug', 'category-match')
        ->assertJsonPath('data.similar_products.1.slug', 'brand-match');

    $similarSlugs = collect($response->json('data.similar_products'))->pluck('slug')->all();
    expect($similarSlugs)->not->toContain('target-phone');
});
