<?php

use App\Models\Banner;

use function Pest\Laravel\withoutMiddleware;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;
use function Pest\Laravel\patchJson;

test('feature products banner endpoints work', function () {
  withoutMiddleware();

  $createdResponse = postJson('/api/banner/feature-products', [
    'title' => 'Featured One',
    'product_id' => 101,
    'is_active' => true,
  ]);

  $createdResponse
    ->assertStatus(201)
    ->assertJsonPath('success', true)
    ->assertJsonPath('data.banner.title', 'Featured One')
    ->assertJsonPath('data.banner.product_id', 101);

  $bannerId = (int) $createdResponse->json('data.banner.id');

  $listResponse = getJson('/api/banner/feature-products');

  $listResponse
    ->assertStatus(200)
    ->assertJsonPath('success', true)
    ->assertJsonPath('data.feature_products.0.id', $bannerId);

  $showResponse = getJson('/api/banner/feature-products/' . $bannerId);

  $showResponse
    ->assertStatus(200)
    ->assertJsonPath('success', true)
    ->assertJsonPath('data.banner.id', $bannerId);

  $updateResponse = patchJson('/api/banner/feature-products/' . $bannerId, [
    'title' => 'Featured Updated',
  ]);

  $updateResponse
    ->assertStatus(200)
    ->assertJsonPath('success', true)
    ->assertJsonPath('data.banner.title', 'Featured Updated');

  $banner = Banner::query()->findOrFail($bannerId);
  expect($banner->type)->toBe('feature_products');
});

test('footer banner endpoints work', function () {
  withoutMiddleware();

  $createdResponse = postJson('/api/banner/footer-banner', [
    'title' => 'Footer One',
    'product_id' => 202,
    'is_active' => true,
  ]);

  $createdResponse
    ->assertStatus(201)
    ->assertJsonPath('success', true)
    ->assertJsonPath('data.banner.title', 'Footer One')
    ->assertJsonPath('data.banner.product_id', 202);

  $bannerId = (int) $createdResponse->json('data.banner.id');

  $listResponse = getJson('/api/banner/footer-banner');

  $listResponse
    ->assertStatus(200)
    ->assertJsonPath('success', true)
    ->assertJsonPath('data.footer_banners.0.id', $bannerId);

  $showResponse = getJson('/api/banner/footer-banner/' . $bannerId);

  $showResponse
    ->assertStatus(200)
    ->assertJsonPath('success', true)
    ->assertJsonPath('data.banner.id', $bannerId);

  $updateResponse = patchJson('/api/banner/footer-banner/' . $bannerId, [
    'title' => 'Footer Updated',
  ]);

  $updateResponse
    ->assertStatus(200)
    ->assertJsonPath('success', true)
    ->assertJsonPath('data.banner.title', 'Footer Updated');

  $banner = Banner::query()->findOrFail($bannerId);
  expect($banner->type)->toBe('footer_banner');
});
