<?php

use App\Models\Category;
use App\Models\DropshippingConnection;
use App\Models\Product;
use App\Models\Sku;
use App\Models\Store;
use App\Models\User;
use App\Services\Api\Dropshipping\DropshippingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Spatie\Permission\Models\Role;
use Tests\Fixtures\Dropshipping\PartialInventoryDropshippingProviderService;
use Tests\Fixtures\Dropshipping\TimelessDropshippingProviderService;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseCount;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\assertDatabaseMissing;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;

uses(RefreshDatabase::class);

test('admin can connect a dropshipping provider', function () {
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);

    /** @var User $admin */
    $admin = User::factory()->create();
    $admin->assignRole($adminRole);

    actingAs($admin, 'api');

    config()->set('dropshipping.providers.aliexpress.credentials', [
        'app_key' => 'test-app-key',
        'app_secret' => 'test-app-secret',
    ]);

    $response = postJson('/api/admin/dropshipping/connect', [
        'provider' => 'aliexpress',
    ]);

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.connection.provider_name', 'aliexpress')
        ->assertJsonPath('data.connection.is_connected', true);

    assertDatabaseHas('dropshipping_connections', [
        'provider_name' => 'aliexpress',
        'connected_by_user_id' => $admin->id,
        'is_connected' => true,
    ]);
});

test('admin can set dropshipping provider credentials in env', function () {
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);

    /** @var User $admin */
    $admin = User::factory()->create();
    $admin->assignRole($adminRole);

    $serviceMock = Mockery::mock(DropshippingService::class);
    $serviceMock->shouldReceive('setProviderCredentialsInEnv')
        ->once()
        ->with('aliexpress', [
            'app_key' => 'ali-app-key',
            'app_secret' => 'ali-app-secret',
        ])
        ->andReturn([
            'provider' => 'aliexpress',
            'updated_fields' => ['app_key', 'app_secret'],
        ]);

    app()->instance(DropshippingService::class, $serviceMock);

    actingAs($admin, 'api');

    $response = postJson('/api/admin/dropshipping/set-credentials', [
        'provider' => 'aliexpress',
        'credentials' => [
            'app_key' => 'ali-app-key',
            'app_secret' => 'ali-app-secret',
        ],
    ]);

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.provider', 'aliexpress')
        ->assertJsonPath('data.updated_fields.0', 'app_key')
        ->assertJsonPath('data.updated_fields.1', 'app_secret');
});

test('seller can search products from all active providers with keyword', function () {
    $sellerRole = Role::firstOrCreate(['name' => 'seller', 'guard_name' => 'api']);

    /** @var User $seller */
    $seller = User::factory()->create([
        'seller_status' => 'approved',
        'seller_approved_at' => now(),
        'status' => 'active',
    ]);
    $seller->assignRole($sellerRole);

    Store::create([
        'user_id' => $seller->id,
        'store_name' => 'store-'.$seller->id,
        'contact_email' => 'store-'.$seller->id.'@example.com',
        'is_active' => true,
    ]);

    config()->set('dropshipping.providers.aliexpress.credentials', [
        'app_key' => 'test-app-key',
        'app_secret' => 'test-app-secret',
    ]);
    config()->set('dropshipping.providers.spocket.credentials', [
        'api_key' => 'spocket-api-key',
    ]);

    DropshippingConnection::create([
        'provider_name' => 'aliexpress',
        'connected_by_user_id' => $seller->id,
        'credentials' => [
            'app_key' => 'test-app-key',
            'app_secret' => 'test-app-secret',
        ],
        'is_connected' => true,
        'connected_at' => now(),
    ]);

    DropshippingConnection::create([
        'provider_name' => 'spocket',
        'connected_by_user_id' => $seller->id,
        'credentials' => [
            'api_key' => 'spocket-api-key',
        ],
        'is_connected' => true,
        'connected_at' => now(),
    ]);

    actingAs($seller, 'api');

    $response = getJson('/api/seller/dropshipping/search-products?keyword=product&page=1&per_page=100');

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.pagination.current_page', 1)
        ->assertJsonPath('data.pagination.total', 160)
        ->assertJsonCount(100, 'data.products');

    $products = $response->json('data.products');

    expect(collect($products)->every(fn ($item) => isset($item['provider_name'])))->toBeTrue();
    expect(collect($products)->pluck('provider_name')->contains('aliexpress'))->toBeTrue();
    expect(collect($products)->pluck('provider_name')->contains('spocket'))->toBeTrue();
});

test('seller can search products from a selected provider only', function () {
    $sellerRole = Role::firstOrCreate(['name' => 'seller', 'guard_name' => 'api']);

    /** @var User $seller */
    $seller = User::factory()->create([
        'seller_status' => 'approved',
        'seller_approved_at' => now(),
        'status' => 'active',
    ]);
    $seller->assignRole($sellerRole);

    Store::create([
        'user_id' => $seller->id,
        'store_name' => 'store-'.$seller->id,
        'contact_email' => 'store-'.$seller->id.'@example.com',
        'is_active' => true,
    ]);

    config()->set('dropshipping.providers.aliexpress.credentials', [
        'app_key' => 'test-app-key',
        'app_secret' => 'test-app-secret',
    ]);
    config()->set('dropshipping.providers.spocket.credentials', [
        'api_key' => 'spocket-api-key',
    ]);

    DropshippingConnection::create([
        'provider_name' => 'aliexpress',
        'connected_by_user_id' => $seller->id,
        'credentials' => [
            'app_key' => 'test-app-key',
            'app_secret' => 'test-app-secret',
        ],
        'is_connected' => true,
        'connected_at' => now(),
    ]);

    DropshippingConnection::create([
        'provider_name' => 'spocket',
        'connected_by_user_id' => $seller->id,
        'credentials' => [
            'api_key' => 'spocket-api-key',
        ],
        'is_connected' => true,
        'connected_at' => now(),
    ]);

    actingAs($seller, 'api');

    $response = getJson('/api/seller/dropshipping/search-products?keyword=product&provider=aliexpress&page=1&per_page=100');

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.pagination.current_page', 1)
        ->assertJsonPath('data.pagination.total', 80)
        ->assertJsonCount(80, 'data.products');

    $products = $response->json('data.products');

    expect(collect($products)->every(fn ($item) => ($item['provider_name'] ?? null) === 'aliexpress'))->toBeTrue();
});

test('seller can search products within a time range', function () {
    $sellerRole = Role::firstOrCreate(['name' => 'seller', 'guard_name' => 'api']);

    /** @var User $seller */
    $seller = User::factory()->create([
        'seller_status' => 'approved',
        'seller_approved_at' => now(),
        'status' => 'active',
    ]);
    $seller->assignRole($sellerRole);

    Store::create([
        'user_id' => $seller->id,
        'store_name' => 'store-'.$seller->id,
        'contact_email' => 'store-'.$seller->id.'@example.com',
        'is_active' => true,
    ]);

    config()->set('dropshipping.providers.aliexpress.credentials', [
        'app_key' => 'test-app-key',
        'app_secret' => 'test-app-secret',
    ]);

    DropshippingConnection::create([
        'provider_name' => 'aliexpress',
        'connected_by_user_id' => $seller->id,
        'credentials' => [
            'app_key' => 'test-app-key',
            'app_secret' => 'test-app-secret',
        ],
        'is_connected' => true,
        'connected_at' => now(),
    ]);

    $fromDate = now()->subDays(10)->toDateString();
    $toDate = now()->subDays(6)->toDateString();
    $fromTimestamp = now()->subDays(10)->startOfDay()->timestamp;
    $toTimestamp = now()->subDays(6)->endOfDay()->timestamp;

    actingAs($seller, 'api');

    $response = getJson('/api/seller/dropshipping/search-products?keyword=product&provider=aliexpress&from='.$fromDate.'&to='.$toDate.'&page=1&per_page=100');

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.pagination.total', 5)
        ->assertJsonCount(5, 'data.products');

    $products = $response->json('data.products');

    expect(collect($products)->every(fn ($item) => isset($item['source_timestamp'])))->toBeTrue();
    expect(collect($products)->every(function ($item) use ($fromTimestamp, $toTimestamp): bool {
        $resolvedTimestamp = strtotime((string) ($item['source_timestamp'] ?? ''));

        return $resolvedTimestamp !== false
            && $resolvedTimestamp >= $fromTimestamp
            && $resolvedTimestamp <= $toTimestamp;
    }))->toBeTrue();
});

test('seller time range does not drop providers with no timestamp metadata', function () {
    $sellerRole = Role::firstOrCreate(['name' => 'seller', 'guard_name' => 'api']);

    /** @var User $seller */
    $seller = User::factory()->create([
        'seller_status' => 'approved',
        'seller_approved_at' => now(),
        'status' => 'active',
    ]);
    $seller->assignRole($sellerRole);

    Store::create([
        'user_id' => $seller->id,
        'store_name' => 'store-'.$seller->id,
        'contact_email' => 'store-'.$seller->id.'@example.com',
        'is_active' => true,
    ]);

    config()->set('dropshipping.providers.timeless', [
        'label' => 'Timeless',
        'service' => TimelessDropshippingProviderService::class,
        'base_url' => 'https://example.com',
        'credential_fields' => [],
        'credential_env_map' => [],
        'credentials' => [],
    ]);

    DropshippingConnection::create([
        'provider_name' => 'timeless',
        'connected_by_user_id' => $seller->id,
        'credentials' => [],
        'is_connected' => true,
        'connected_at' => now(),
    ]);

    $fromDate = now()->subDays(10)->toDateString();
    $toDate = now()->toDateString();

    actingAs($seller, 'api');

    $response = getJson('/api/seller/dropshipping/search-products?keyword=product&provider=timeless&from='.$fromDate.'&to='.$toDate.'&page=1&per_page=20');

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.pagination.total', 80)
        ->assertJsonCount(20, 'data.products');

    $products = $response->json('data.products');

    expect(collect($products)->every(fn ($item) => ($item['provider_name'] ?? null) === 'timeless'))->toBeTrue();
});

test('seller search falls back to active provider catalog when keyword has no match', function () {
    $sellerRole = Role::firstOrCreate(['name' => 'seller', 'guard_name' => 'api']);

    /** @var User $seller */
    $seller = User::factory()->create([
        'seller_status' => 'approved',
        'seller_approved_at' => now(),
        'status' => 'active',
    ]);
    $seller->assignRole($sellerRole);

    Store::create([
        'user_id' => $seller->id,
        'store_name' => 'store-'.$seller->id,
        'contact_email' => 'store-'.$seller->id.'@example.com',
        'is_active' => true,
    ]);

    config()->set('dropshipping.providers.aliexpress.credentials', [
        'app_key' => 'test-app-key',
        'app_secret' => 'test-app-secret',
    ]);
    config()->set('dropshipping.search_fallback_when_empty', true);

    DropshippingConnection::create([
        'provider_name' => 'aliexpress',
        'connected_by_user_id' => $seller->id,
        'credentials' => [
            'app_key' => 'test-app-key',
            'app_secret' => 'test-app-secret',
        ],
        'is_connected' => true,
        'connected_at' => now(),
    ]);

    actingAs($seller, 'api');

    $response = getJson('/api/seller/dropshipping/search-products?keyword=no-match-keyword&page=1&per_page=20');

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.pagination.total', 40)
        ->assertJsonCount(20, 'data.products');

    $products = $response->json('data.products');

    expect(collect($products)->every(fn ($item) => ($item['is_fallback_result'] ?? false) === true))->toBeTrue();
    expect(collect($products)->pluck('provider_name')->unique()->values()->all())->toBe(['aliexpress']);
});

test('admin can sync provider products', function () {
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);

    /** @var User $admin */
    $admin = User::factory()->create();
    $admin->assignRole($adminRole);

    config()->set('dropshipping.providers.aliexpress.credentials', [
        'app_key' => 'test-app-key',
        'app_secret' => 'test-app-secret',
    ]);

    DropshippingConnection::create([
        'provider_name' => 'aliexpress',
        'connected_by_user_id' => $admin->id,
        'credentials' => [
            'app_key' => 'test-app-key',
            'app_secret' => 'test-app-secret',
        ],
        'is_connected' => true,
        'connected_at' => now(),
    ]);

    actingAs($admin, 'api');

    $response = postJson('/api/admin/dropshipping/sync', [
        'provider' => 'aliexpress',
        'limit' => 3,
    ]);

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.products_synced', 3);

    assertDatabaseCount('products', 3);
});

test('seller can save a selected provider product to own store', function () {
    $sellerRole = Role::firstOrCreate(['name' => 'seller', 'guard_name' => 'api']);

    /** @var User $seller */
    $seller = User::factory()->create([
        'seller_status' => 'approved',
        'seller_approved_at' => now(),
        'status' => 'active',
    ]);
    $seller->assignRole($sellerRole);

    $store = Store::create([
        'user_id' => $seller->id,
        'store_name' => 'store-'.$seller->id,
        'contact_email' => 'store-'.$seller->id.'@example.com',
        'is_active' => true,
    ]);

    config()->set('dropshipping.providers.aliexpress.credentials', [
        'app_key' => 'test-app-key',
        'app_secret' => 'test-app-secret',
    ]);

    DropshippingConnection::create([
        'provider_name' => 'aliexpress',
        'connected_by_user_id' => $seller->id,
        'credentials' => [
            'app_key' => 'test-app-key',
            'app_secret' => 'test-app-secret',
        ],
        'is_connected' => true,
        'connected_at' => now(),
    ]);

    actingAs($seller, 'api');

    $response = postJson('/api/seller/dropshipping/save-to-store', [
        'provider' => 'aliexpress',
        'provider_product_id' => 'ALIEXPRESS-P-12',
        'store_id' => $store->id,
    ]);

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.product.provider_product_id', 'ALIEXPRESS-P-12')
        ->assertJsonPath('data.product.provider_name', 'aliexpress')
        ->assertJsonPath('data.product.saved_product.provider_product_id', 'ALIEXPRESS-P-12');

    assertDatabaseHas('products', [
        'seller_id' => $seller->id,
        'store_id' => $store->id,
        'provider_name' => 'aliexpress',
        'provider_product_id' => 'ALIEXPRESS-P-12',
    ]);
});

test('seller can save a selected provider product using alias payload fields', function () {
    $sellerRole = Role::firstOrCreate(['name' => 'seller', 'guard_name' => 'api']);

    /** @var User $seller */
    $seller = User::factory()->create([
        'seller_status' => 'approved',
        'seller_approved_at' => now(),
        'status' => 'active',
    ]);
    $seller->assignRole($sellerRole);

    $store = Store::create([
        'user_id' => $seller->id,
        'store_name' => 'store-'.$seller->id,
        'contact_email' => 'store-'.$seller->id.'@example.com',
        'is_active' => true,
    ]);

    config()->set('dropshipping.providers.aliexpress.credentials', [
        'app_key' => 'test-app-key',
        'app_secret' => 'test-app-secret',
    ]);

    DropshippingConnection::create([
        'provider_name' => 'aliexpress',
        'connected_by_user_id' => $seller->id,
        'credentials' => [
            'app_key' => 'test-app-key',
            'app_secret' => 'test-app-secret',
        ],
        'is_connected' => true,
        'connected_at' => now(),
    ]);

    actingAs($seller, 'api');

    $response = postJson('/api/seller/dropshipping/save-to-store', [
        'providerName' => 'aliexpress',
        'productId' => 'ALIEXPRESS-P-13',
        'storeId' => $store->id,
    ]);

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.product.provider_name', 'aliexpress')
        ->assertJsonPath('data.product.provider_product_id', 'ALIEXPRESS-P-13')
        ->assertJsonPath('data.product.saved_product.provider_name', 'aliexpress');

    assertDatabaseHas('products', [
        'seller_id' => $seller->id,
        'store_id' => $store->id,
        'provider_name' => 'aliexpress',
        'provider_product_id' => 'ALIEXPRESS-P-13',
    ]);
});

test('seller can save provider product and assign primary category', function () {
    $sellerRole = Role::firstOrCreate(['name' => 'seller', 'guard_name' => 'api']);

    /** @var User $seller */
    $seller = User::factory()->create([
        'seller_status' => 'approved',
        'seller_approved_at' => now(),
        'status' => 'active',
    ]);
    $seller->assignRole($sellerRole);

    $store = Store::create([
        'user_id' => $seller->id,
        'store_name' => 'store-'.$seller->id,
        'contact_email' => 'store-'.$seller->id.'@example.com',
        'is_active' => true,
    ]);

    $category = Category::query()->create([
        'title' => 'Electronics',
        'sort_order' => 0,
        'is_active' => true,
    ]);

    config()->set('dropshipping.providers.aliexpress.credentials', [
        'app_key' => 'test-app-key',
        'app_secret' => 'test-app-secret',
    ]);

    DropshippingConnection::create([
        'provider_name' => 'aliexpress',
        'connected_by_user_id' => $seller->id,
        'credentials' => [
            'app_key' => 'test-app-key',
            'app_secret' => 'test-app-secret',
        ],
        'is_connected' => true,
        'connected_at' => now(),
    ]);

    actingAs($seller, 'api');

    $response = postJson('/api/seller/dropshipping/save-to-store', [
        'provider' => 'aliexpress',
        'provider_product_id' => 'ALIEXPRESS-P-12',
        'store_id' => $store->id,
        'categoryId' => $category->id,
    ]);

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.product.provider_product_id', 'ALIEXPRESS-P-12')
        ->assertJsonPath('data.product.categories.0.id', $category->id);

    $productId = (int) $response->json('data.product.id');

    assertDatabaseHas('category_product', [
        'product_id' => $productId,
        'category_id' => $category->id,
        'is_primary' => true,
    ]);
});

test('seller can save provider product with category and markup payload fields', function () {
    $sellerRole = Role::firstOrCreate(['name' => 'seller', 'guard_name' => 'api']);

    /** @var User $seller */
    $seller = User::factory()->create([
        'seller_status' => 'approved',
        'seller_approved_at' => now(),
        'status' => 'active',
    ]);
    $seller->assignRole($sellerRole);

    $store = Store::create([
        'user_id' => $seller->id,
        'store_name' => 'store-'.$seller->id,
        'contact_email' => 'store-'.$seller->id.'@example.com',
        'is_active' => true,
    ]);

    $category = Category::query()->create([
        'title' => 'Beauty',
        'sort_order' => 0,
        'is_active' => true,
    ]);

    config()->set('dropshipping.providers.aliexpress.credentials', [
        'app_key' => 'test-app-key',
        'app_secret' => 'test-app-secret',
    ]);

    DropshippingConnection::create([
        'provider_name' => 'aliexpress',
        'connected_by_user_id' => $seller->id,
        'credentials' => [
            'app_key' => 'test-app-key',
            'app_secret' => 'test-app-secret',
        ],
        'is_connected' => true,
        'connected_at' => now(),
    ]);

    actingAs($seller, 'api');

    $markupPrice = 12.5;

    $response = postJson('/api/products/save-to-store', [
        'provider' => 'aliexpress',
        'provider_product_id' => 'ALIEXPRESS-P-12',
        'category_id' => $category->id,
        'markup_price' => $markupPrice,
    ]);

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.product.provider_product_id', 'ALIEXPRESS-P-12')
        ->assertJsonPath('data.product.categories.0.id', $category->id);

    expect((float) $response->json('data.product.markup_price'))->toBe($markupPrice);

    $product = Product::query()
        ->where('seller_id', $seller->id)
        ->where('provider_name', 'aliexpress')
        ->where('provider_product_id', 'ALIEXPRESS-P-12')
        ->firstOrFail();

    expect((float) $product->markup_price)->toBe($markupPrice);
    expect(Sku::query()->where('product_id', $product->id)->exists())->toBeTrue();
    expect(
        Sku::query()
            ->where('product_id', $product->id)
            ->where('markup_price', $markupPrice)
            ->exists()
    )->toBeTrue();

    assertDatabaseHas('category_product', [
        'product_id' => $product->id,
        'category_id' => $category->id,
        'is_primary' => true,
    ]);
});

test('seller saves only skus with inventory count greater than zero', function () {
    $sellerRole = Role::firstOrCreate(['name' => 'seller', 'guard_name' => 'api']);

    /** @var User $seller */
    $seller = User::factory()->create([
        'seller_status' => 'approved',
        'seller_approved_at' => now(),
        'status' => 'active',
    ]);
    $seller->assignRole($sellerRole);

    $store = Store::create([
        'user_id' => $seller->id,
        'store_name' => 'store-'.$seller->id,
        'contact_email' => 'store-'.$seller->id.'@example.com',
        'is_active' => true,
    ]);

    config()->set('dropshipping.providers.partial_inventory', [
        'label' => 'Partial Inventory Provider',
        'service' => PartialInventoryDropshippingProviderService::class,
        'base_url' => 'https://example.com',
        'credential_fields' => [],
        'credential_env_map' => [],
        'credentials' => [],
    ]);

    DropshippingConnection::create([
        'provider_name' => 'partial_inventory',
        'connected_by_user_id' => $seller->id,
        'credentials' => [],
        'is_connected' => true,
        'connected_at' => now(),
    ]);

    actingAs($seller, 'api');

    $response = postJson('/api/products/save-to-store', [
        'provider' => 'partial_inventory',
        'provider_product_id' => 'PARTIALINVENTORY-P-1',
        'store_id' => $store->id,
    ]);

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.product.provider_product_id', 'PARTIALINVENTORY-P-1')
        ->assertJsonPath('data.product.skus.0.inventory_count', 7)
        ->assertJsonCount(1, 'data.product.skus');

    $product = Product::query()
        ->where('seller_id', $seller->id)
        ->where('provider_name', 'partial_inventory')
        ->where('provider_product_id', 'PARTIALINVENTORY-P-1')
        ->firstOrFail();

    assertDatabaseHas('skus', [
        'product_id' => $product->id,
        'provider_sku_id' => 'PARTIALINVENTORY-S-1-2',
        'inventory_count' => 7,
    ]);

    assertDatabaseMissing('skus', [
        'product_id' => $product->id,
        'provider_sku_id' => 'PARTIALINVENTORY-S-1-1',
    ]);
});

test('seller save-to-store generates and returns a product slug', function () {
    $sellerRole = Role::firstOrCreate(['name' => 'seller', 'guard_name' => 'api']);

    /** @var User $seller */
    $seller = User::factory()->create([
        'seller_status' => 'approved',
        'seller_approved_at' => now(),
        'status' => 'active',
    ]);
    $seller->assignRole($sellerRole);

    $store = Store::create([
        'user_id' => $seller->id,
        'store_name' => 'store-'.$seller->id,
        'contact_email' => 'store-'.$seller->id.'@example.com',
        'is_active' => true,
    ]);

    config()->set('dropshipping.providers.partial_inventory', [
        'label' => 'Partial Inventory Provider',
        'service' => PartialInventoryDropshippingProviderService::class,
        'base_url' => 'https://example.com',
        'credential_fields' => [],
        'credential_env_map' => [],
        'credentials' => [],
    ]);

    DropshippingConnection::create([
        'provider_name' => 'partial_inventory',
        'connected_by_user_id' => $seller->id,
        'credentials' => [],
        'is_connected' => true,
        'connected_at' => now(),
    ]);

    actingAs($seller, 'api');

    $response = postJson('/api/products/save-to-store', [
        'provider' => 'partial_inventory',
        'provider_product_id' => 'PARTIALINVENTORY-P-1',
        'store_id' => $store->id,
    ]);

    $response->assertStatus(200)->assertJsonPath('success', true);

    $product = Product::query()
        ->where('seller_id', $seller->id)
        ->where('provider_name', 'partial_inventory')
        ->where('provider_product_id', 'PARTIALINVENTORY-P-1')
        ->firstOrFail();

    expect($product->slug)->not->toBe('');
    $response->assertJsonPath('data.product.slug', $product->slug);
    assertDatabaseHas('products', [
        'id' => $product->id,
        'slug' => $product->slug,
    ]);
});

test('seller can fetch details with cj alias and save by using provider_name from details payload', function () {
    $sellerRole = Role::firstOrCreate(['name' => 'seller', 'guard_name' => 'api']);

    /** @var User $seller */
    $seller = User::factory()->create([
        'seller_status' => 'approved',
        'seller_approved_at' => now(),
        'status' => 'active',
    ]);
    $seller->assignRole($sellerRole);

    $store = Store::create([
        'user_id' => $seller->id,
        'store_name' => 'store-'.$seller->id,
        'contact_email' => 'store-'.$seller->id.'@example.com',
        'is_active' => true,
    ]);

    config()->set('dropshipping.providers.cj_dropshipping', [
        'label' => 'CJ Dropshipping',
        'service' => TimelessDropshippingProviderService::class,
        'base_url' => 'https://example.com',
        'credential_fields' => [],
        'credential_env_map' => [],
        'credentials' => [],
    ]);

    DropshippingConnection::create([
        'provider_name' => 'cj_dropshipping',
        'connected_by_user_id' => $seller->id,
        'credentials' => [],
        'is_connected' => true,
        'connected_at' => now(),
    ]);

    actingAs($seller, 'api');

    $detailsResponse = getJson('/api/products/product-details?provider=cjdropshipping&provider_product_id=TIMELESS-P-1');

    $detailsResponse
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.product.provider_name', 'cj_dropshipping')
        ->assertJsonPath('data.product.provider_product_id', 'TIMELESS-P-1')
        ->assertJsonPath('data.product.original_url', 'https://cjdropshipping.com/product/timeless-product-1-p-TIMELESS-P-1.html')
        ->assertJsonPath('data.product.attributes.0.id', 'attr_color')
        ->assertJsonPath('data.product.attributes.0.name', 'Color')
        ->assertJsonPath('data.product.attributes.0.type', 'image')
        ->assertJsonPath('data.product.attributes.0.options.0.value', 'Black')
        ->assertJsonPath('data.product.attributes.0.options.0.option_image', 'https://cf.cjdropshipping.com/2049/1392938159916.jpg')
        ->assertJsonPath('data.product.attributes.1.id', 'attr_size')
        ->assertJsonPath('data.product.attributes.1.type', 'text')
        ->assertJsonPath('data.product.skus.0.provider_sku_code', 'CJTEST-1')
        ->assertJsonPath('data.product.skus.0.attributes.Color', 'Black')
        ->assertJsonPath('data.product.skus.0.attributes.Size', 'L');

    $saveResponse = postJson('/api/products/save-to-store', [
        'provider_name' => $detailsResponse->json('data.product.provider_name'),
        'provider_product_id' => $detailsResponse->json('data.product.provider_product_id'),
        'store_id' => $store->id,
    ]);

    $saveResponse
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.product.provider_name', 'cj_dropshipping')
        ->assertJsonPath('data.product.provider_product_id', 'TIMELESS-P-1');

    assertDatabaseHas('products', [
        'seller_id' => $seller->id,
        'store_id' => $store->id,
        'provider_name' => 'cj_dropshipping',
        'provider_product_id' => 'TIMELESS-P-1',
    ]);
});

test('seller save-to-store with cj provider enriches sku inventory from inventory api', function () {
    $sellerRole = Role::firstOrCreate(['name' => 'seller', 'guard_name' => 'api']);

    /** @var User $seller */
    $seller = User::factory()->create([
        'seller_status' => 'approved',
        'seller_approved_at' => now(),
        'status' => 'active',
    ]);
    $seller->assignRole($sellerRole);

    $store = Store::create([
        'user_id' => $seller->id,
        'store_name' => 'store-'.$seller->id,
        'contact_email' => 'store-'.$seller->id.'@example.com',
        'is_active' => true,
    ]);

    DropshippingConnection::create([
        'provider_name' => 'cj_dropshipping',
        'connected_by_user_id' => $seller->id,
        'credentials' => [
            'api_key' => 'cj-test-key',
        ],
        'is_connected' => true,
        'connected_at' => now(),
    ]);

    Http::fake([
        'https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken' => Http::response([
            'code' => 200,
            'result' => true,
            'message' => 'Success',
            'data' => ['accessToken' => 'token-123'],
        ], 200),
        'https://developers.cjdropshipping.com/api2.0/v1/product/query*' => Http::response([
            'code' => 200,
            'result' => true,
            'message' => 'Success',
            'data' => [
                'pid' => 'CJ-P-100',
                'productNameEn' => 'CJ Test Product',
                'sellPrice' => '9.99',
                'status' => '3',
                'variants' => [
                    [
                        'vid' => 'VID-1',
                        'variantSku' => 'CJTEST-1',
                        'variantKey' => 'Black-L',
                        'variantSellPrice' => 10.25,
                        'variantImage' => 'https://cf.cjdropshipping.com/2049/1392938159916.jpg',
                        'inventories' => null,
                    ],
                    [
                        'vid' => 'VID-2',
                        'variantSku' => 'CJTEST-2',
                        'variantKey' => 'White-M',
                        'variantSellPrice' => 11.75,
                        'inventories' => null,
                    ],
                ],
            ],
        ], 200),
        'https://developers.cjdropshipping.com/api2.0/v1/product/stock/getInventoryByPid*' => Http::response([
            'code' => 200,
            'result' => true,
            'message' => 'Success',
            'data' => [
                'variantInventories' => [
                    [
                        'vid' => 'VID-1',
                        'inventory' => [
                            ['totalInventory' => 7],
                            ['totalInventory' => 5],
                        ],
                    ],
                    [
                        'vid' => 'VID-2',
                        'inventory' => [
                            ['totalInventory' => 3],
                        ],
                    ],
                ],
            ],
        ], 200),
    ]);

    actingAs($seller, 'api');

    $response = postJson('/api/products/save-to-store', [
        'provider' => 'cj_dropshipping',
        'provider_product_id' => 'CJ-P-100',
        'store_id' => $store->id,
    ]);

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.product.provider_product_id', 'CJ-P-100');

    $productId = (int) $response->json('data.product.id');

    assertDatabaseHas('skus', [
        'product_id' => $productId,
        'provider_sku_id' => 'VID-1',
        'inventory_count' => 12,
    ]);

    assertDatabaseHas('skus', [
        'product_id' => $productId,
        'provider_sku_id' => 'VID-2',
        'inventory_count' => 3,
    ]);
});

test('different sellers can import the same provider product without SKU code conflicts', function () {
    $sellerRole = Role::firstOrCreate(['name' => 'seller', 'guard_name' => 'api']);

    /** @var User $firstSeller */
    $firstSeller = User::factory()->create([
        'seller_status' => 'approved',
        'seller_approved_at' => now(),
        'status' => 'active',
    ]);
    $firstSeller->assignRole($sellerRole);

    /** @var User $secondSeller */
    $secondSeller = User::factory()->create([
        'seller_status' => 'approved',
        'seller_approved_at' => now(),
        'status' => 'active',
    ]);
    $secondSeller->assignRole($sellerRole);

    $firstStore = Store::create([
        'user_id' => $firstSeller->id,
        'store_name' => 'store-'.$firstSeller->id,
        'contact_email' => 'store-'.$firstSeller->id.'@example.com',
        'is_active' => true,
    ]);

    $secondStore = Store::create([
        'user_id' => $secondSeller->id,
        'store_name' => 'store-'.$secondSeller->id,
        'contact_email' => 'store-'.$secondSeller->id.'@example.com',
        'is_active' => true,
    ]);

    config()->set('dropshipping.providers.aliexpress.credentials', [
        'app_key' => 'test-app-key',
        'app_secret' => 'test-app-secret',
    ]);

    DropshippingConnection::create([
        'provider_name' => 'aliexpress',
        'connected_by_user_id' => $firstSeller->id,
        'credentials' => [
            'app_key' => 'test-app-key',
            'app_secret' => 'test-app-secret',
        ],
        'is_connected' => true,
        'connected_at' => now(),
    ]);

    actingAs($firstSeller, 'api');

    postJson('/api/products/save-to-store', [
        'provider' => 'aliexpress',
        'provider_product_id' => 'ALIEXPRESS-P-12',
        'store_id' => $firstStore->id,
    ])->assertStatus(200)->assertJsonPath('success', true);

    actingAs($secondSeller, 'api');

    postJson('/api/products/save-to-store', [
        'provider' => 'aliexpress',
        'provider_product_id' => 'ALIEXPRESS-P-12',
        'store_id' => $secondStore->id,
    ])->assertStatus(200)->assertJsonPath('success', true);

    $firstProduct = Product::query()
        ->where('seller_id', $firstSeller->id)
        ->where('provider_name', 'aliexpress')
        ->where('provider_product_id', 'ALIEXPRESS-P-12')
        ->firstOrFail();

    $secondProduct = Product::query()
        ->where('seller_id', $secondSeller->id)
        ->where('provider_name', 'aliexpress')
        ->where('provider_product_id', 'ALIEXPRESS-P-12')
        ->firstOrFail();

    $firstSellerSkuCodes = Sku::query()
        ->where('product_id', $firstProduct->id)
        ->pluck('code')
        ->all();

    $secondSellerSkuCodes = Sku::query()
        ->where('product_id', $secondProduct->id)
        ->pluck('code')
        ->all();

    expect(count($firstSellerSkuCodes))->toBeGreaterThan(0);
    expect(array_intersect($firstSellerSkuCodes, $secondSellerSkuCodes))->toBe([]);
});

test('admin can disconnect provider connection', function () {
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);

    /** @var User $admin */
    $admin = User::factory()->create();
    $admin->assignRole($adminRole);

    config()->set('dropshipping.providers.aliexpress.credentials', [
        'app_key' => 'test-app-key',
        'app_secret' => 'test-app-secret',
    ]);

    DropshippingConnection::create([
        'provider_name' => 'aliexpress',
        'connected_by_user_id' => $admin->id,
        'credentials' => [
            'app_key' => 'test-app-key',
            'app_secret' => 'test-app-secret',
        ],
        'is_connected' => true,
        'connected_at' => now(),
    ]);

    actingAs($admin, 'api');

    $response = postJson('/api/admin/dropshipping/disconnect', [
        'provider' => 'aliexpress',
    ]);

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.connection.is_connected', false);

    assertDatabaseHas('dropshipping_connections', [
        'provider_name' => 'aliexpress',
        'connected_by_user_id' => $admin->id,
        'is_connected' => false,
    ]);
});
