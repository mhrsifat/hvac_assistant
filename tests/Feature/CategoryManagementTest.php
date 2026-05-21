<?php

use App\Models\Category;
use App\Models\User;
use Spatie\Permission\Models\Role;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\assertSoftDeleted;
use function Pest\Laravel\deleteJson;
use function Pest\Laravel\getJson;
use function Pest\Laravel\patchJson;
use function Pest\Laravel\postJson;
use function Pest\Laravel\putJson;

function createAdmin(): User
{
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);

    /** @var User $admin */
    $admin = User::factory()->create();
    $admin->assignRole($adminRole);

    return $admin;
}

test('admin can create category', function () {
    $admin = createAdmin();

    actingAs($admin, 'api');

    $response = postJson('/api/categories', [
        'title' => 'Sports Shoes',
        'description' => 'All sports and running shoes',
        'thumbnail' => 'categories/shoes.png',
        'sort_order' => 2,
        'is_active' => true,
    ]);

    $response
        ->assertStatus(201)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.category.title', 'Sports Shoes')
        ->assertJsonPath('data.category.is_active', true);

    assertDatabaseHas('categories', [
        'title' => 'Sports Shoes',
        'thumbnail' => 'categories/shoes.png',
        'is_active' => true,
    ]);
});

test('admin can create category with parent category', function () {
    $admin = createAdmin();

    $parentCategory = Category::query()->create([
        'title' => 'Electronics',
        'sort_order' => 0,
        'is_active' => true,
    ]);

    actingAs($admin, 'api');

    $response = postJson('/api/categories', [
        'parent_id' => $parentCategory->id,
        'title' => 'Smart Phones',
        'description' => 'Smart phone category',
        'sort_order' => 1,
        'is_active' => true,
    ]);

    $response
        ->assertStatus(201)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.category.parent_id', $parentCategory->id)
        ->assertJsonPath('data.category.parent.id', $parentCategory->id);

    assertDatabaseHas('categories', [
        'title' => 'Smart Phones',
        'parent_id' => $parentCategory->id,
    ]);
});

test('admin can list categories', function () {
    $admin = createAdmin();

    Category::query()->create([
        'title' => 'Shoes',
        'description' => 'Shoe category',
        'sort_order' => 0,
        'is_active' => true,
    ]);

    Category::query()->create([
        'title' => 'Bags',
        'description' => 'Bag category',
        'sort_order' => 1,
        'is_active' => false,
    ]);

    actingAs($admin, 'api');

    $response = getJson('/api/categories?per_page=12');

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.pagination.per_page', 12)
        ->assertJsonCount(2, 'data.categories');
});

test('admin can fetch nested category tree', function () {
    $admin = createAdmin();

    $rootCategory = Category::query()->create([
        'title' => 'Electronics',
        'sort_order' => 0,
        'is_active' => true,
    ]);

    $childCategory = Category::query()->create([
        'parent_id' => $rootCategory->id,
        'title' => 'Phones',
        'sort_order' => 1,
        'is_active' => true,
    ]);

    Category::query()->create([
        'parent_id' => $childCategory->id,
        'title' => 'Android Phones',
        'sort_order' => 2,
        'is_active' => true,
    ]);

    actingAs($admin, 'api');

    $response = getJson('/api/categories/tree');

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.categories.0.title', 'Electronics')
        ->assertJsonPath('data.categories.0.children.0.title', 'Phones')
        ->assertJsonPath('data.categories.0.children.0.children.0.title', 'Android Phones');
});

test('admin can update category', function () {
    $admin = createAdmin();

    $category = Category::query()->create([
        'title' => 'Old Category',
        'description' => 'Old description',
        'sort_order' => 3,
        'is_active' => true,
    ]);

    actingAs($admin, 'api');

    $response = putJson("/api/categories/{$category->id}", [
        'title' => 'Updated Category',
        'description' => 'Updated description',
        'sort_order' => 1,
        'thumbnail' => 'categories/updated.png',
    ]);

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.category.title', 'Updated Category')
        ->assertJsonPath('data.category.sort_order', 1);

    assertDatabaseHas('categories', [
        'id' => $category->id,
        'title' => 'Updated Category',
        'thumbnail' => 'categories/updated.png',
        'sort_order' => 1,
    ]);
});

test('admin can set parent category on update', function () {
    $admin = createAdmin();

    $parentCategory = Category::query()->create([
        'title' => 'Home Appliances',
        'sort_order' => 0,
        'is_active' => true,
    ]);

    $childCategory = Category::query()->create([
        'title' => 'Kitchen Tools',
        'sort_order' => 1,
        'is_active' => true,
    ]);

    actingAs($admin, 'api');

    $response = putJson("/api/categories/{$childCategory->id}", [
        'parent_id' => $parentCategory->id,
        'title' => 'Kitchen Tools',
    ]);

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.category.parent_id', $parentCategory->id)
        ->assertJsonPath('data.category.parent.id', $parentCategory->id);

    assertDatabaseHas('categories', [
        'id' => $childCategory->id,
        'parent_id' => $parentCategory->id,
    ]);
});

test('admin cannot set circular parent hierarchy', function () {
    $admin = createAdmin();

    $parentCategory = Category::query()->create([
        'title' => 'Computers',
        'sort_order' => 0,
        'is_active' => true,
    ]);

    $childCategory = Category::query()->create([
        'parent_id' => $parentCategory->id,
        'title' => 'Laptops',
        'sort_order' => 1,
        'is_active' => true,
    ]);

    actingAs($admin, 'api');

    $response = putJson("/api/categories/{$parentCategory->id}", [
        'parent_id' => $childCategory->id,
        'title' => 'Computers',
    ]);

    $response
        ->assertStatus(422)
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Selected parent category is invalid.');

    assertDatabaseHas('categories', [
        'id' => $parentCategory->id,
        'parent_id' => null,
    ]);
});

test('admin can update category status', function () {
    $admin = createAdmin();

    $category = Category::query()->create([
        'title' => 'Status Category',
        'sort_order' => 0,
        'is_active' => true,
    ]);

    actingAs($admin, 'api');

    $response = patchJson("/api/categories/{$category->id}/status", [
        'is_active' => false,
    ]);

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.category.is_active', false);

    assertDatabaseHas('categories', [
        'id' => $category->id,
        'is_active' => false,
    ]);
});

test('admin can delete category', function () {
    $admin = createAdmin();

    $category = Category::query()->create([
        'title' => 'Delete Category',
        'sort_order' => 0,
        'is_active' => true,
    ]);

    actingAs($admin, 'api');

    $response = deleteJson("/api/categories/{$category->id}");

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true);

    assertSoftDeleted('categories', [
        'id' => $category->id,
    ]);
});

test('seller cannot access category admin endpoints', function () {
    $sellerRole = Role::firstOrCreate(['name' => 'seller', 'guard_name' => 'api']);

    /** @var User $seller */
    $seller = User::factory()->create();
    $seller->assignRole($sellerRole);

    actingAs($seller, 'api');

    $response = getJson('/api/categories');

    $response->assertStatus(500);
});
