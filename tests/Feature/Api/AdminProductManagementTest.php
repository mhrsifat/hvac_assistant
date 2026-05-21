<?php

use App\Models\Product;
use App\Models\User;
use Spatie\Permission\Models\Role;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertSoftDeleted;
use function Pest\Laravel\deleteJson;
use function Pest\Laravel\getJson;
use function Pest\Laravel\patchJson;

function createAdminUser(): User
{
  $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);

  /** @var User $admin */
  $admin = User::factory()->create();
  $admin->assignRole($adminRole);

  return $admin;
}

test('admin can list products', function () {
  $admin = createAdminUser();

  Product::factory()->count(3)->create([
    'title' => 'Test Product',
  ]);

  actingAs($admin, 'api');

  $response = getJson('/api/admin/products?per_page=2');

  $response
    ->assertStatus(200)
    ->assertJsonPath('success', true)
    ->assertJsonPath('data.pagination.per_page', 2)
    ->assertJsonCount(2, 'data.products');
});

test('admin can change product status', function () {
  $admin = createAdminUser();

  $product = Product::factory()->create([
    'is_active' => true,
  ]);

  actingAs($admin, 'api');

  $response = patchJson('/api/admin/products/' . $product->id . '/status', [
    'is_active' => false,
  ]);

  $response
    ->assertStatus(200)
    ->assertJsonPath('success', true)
    ->assertJsonPath('data.product.id', $product->id)
    ->assertJsonPath('data.product.is_active', false);
});

test('admin can change product feature status', function () {
  $admin = createAdminUser();

  $product = Product::factory()->create([
    'is_featured' => false,
  ]);

  actingAs($admin, 'api');

  $response = patchJson('/api/admin/products/' . $product->id . '/feature', [
    'is_featured' => true,
  ]);

  $response
    ->assertStatus(200)
    ->assertJsonPath('success', true)
    ->assertJsonPath('data.product.id', $product->id)
    ->assertJsonPath('data.product.is_featured', true);
});

test('admin can delete product', function () {
  $admin = createAdminUser();

  $product = Product::factory()->create();

  actingAs($admin, 'api');

  $response = deleteJson('/api/admin/products/' . $product->id);

  $response
    ->assertStatus(200)
    ->assertJsonPath('success', true)
    ->assertJsonPath('data.product_id', $product->id);

  assertSoftDeleted('products', [
    'id' => $product->id,
  ]);
});
