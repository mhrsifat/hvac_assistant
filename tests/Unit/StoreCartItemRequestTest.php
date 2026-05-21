<?php

use App\Http\Requests\Api\Store\StoreCartItemRequest;

test('store cart item request requires product slug rule', function () {
    $request = new StoreCartItemRequest;
    $rules = $request->rules();

    expect($rules)->toHaveKey('product_slug');
    expect($rules['product_slug'])->toContain('required');
    expect($rules['product_slug'])->toContain('exists:products,slug');
    expect($rules)->not->toHaveKey('product_id');
});

test('store cart item request normalizes slug and quantity aliases', function () {
    $request = StoreCartItemRequest::create('/api/store/cart/items', 'POST', [
        'slug' => 'demo-product',
        'count' => 3,
    ]);

    $method = new ReflectionMethod(StoreCartItemRequest::class, 'prepareForValidation');
    $method->setAccessible(true);
    $method->invoke($request);

    expect($request->input('product_slug'))->toBe('demo-product');
    expect((int) $request->input('quantity'))->toBe(3);
});
