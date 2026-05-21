<?php

use App\Models\Category;
use App\Models\Coupon;
use App\Models\Product;
use App\Models\ShippingAddress;
use App\Models\Sku;
use App\Models\User;
use App\Services\Api\Store\StripeOrderPaymentService;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\deleteJson;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;
use function Pest\Laravel\putJson;

test('authenticated user can manage cart items and coupon', function () {
    $category = Category::query()->create([
        'title' => 'Phones',
        'sort_order' => 0,
        'is_active' => true,
    ]);

    $product = Product::factory()->create([
        'title' => 'Phone X',
        'is_active' => true,
        'base_price' => 100,
        'markup_price' => 0,
    ]);
    $product->categories()->attach($category->id, ['is_primary' => true]);

    $sku = Sku::factory()->create([
        'product_id' => $product->id,
        'inventory_count' => 20,
        'is_active' => true,
        'base_price' => 100,
        'markup_price' => 0,
    ]);

    Coupon::query()->create([
        'code' => 'SAVE10',
        'title' => 'Save 10%',
        'discount_type' => 'percentage',
        'discount_value' => 10,
        'is_active' => true,
    ]);

    /** @var User $user */
    $user = User::factory()->create();
    actingAs($user, 'api');

    $addResponse = postJson('/api/store/cart/items', [
        'sku_code' => $sku->code,
        'quantity' => 2,
    ]);

    $addResponse
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.cart.item_count', 2)
        ->assertJsonPath('data.cart.total', 200);

    postJson('/api/store/cart/coupons', [
        'coupon_code' => 'SAVE10',
    ])
        ->assertStatus(200)
        ->assertJsonPath('data.cart.coupon_code', 'SAVE10')
        ->assertJsonPath('data.cart.total', 180);

    putJson('/api/store/cart/items/'.$sku->code, [
        'quantity' => 3,
    ])
        ->assertStatus(200)
        ->assertJsonPath('data.cart.item_count', 3)
        ->assertJsonPath('data.cart.total', 270);

    $removeCouponResponse = deleteJson('/api/store/cart/coupons');
    $removeCouponResponse
        ->assertStatus(200)
        ->assertJsonPath('data.cart.coupon_code', null)
        ->assertJsonPath('data.cart.total', 300);

    deleteJson('/api/store/cart/items/'.$sku->code)
        ->assertStatus(200)
        ->assertJsonPath('data.cart.item_count', 0)
        ->assertJsonPath('data.cart.total', 0);
});

test('authenticated user can place cash on delivery order', function () {
    $product = Product::factory()->create([
        'title' => 'Headphone Pro',
        'is_active' => true,
        'base_price' => 50,
        'markup_price' => 0,
    ]);

    $sku = Sku::factory()->create([
        'product_id' => $product->id,
        'inventory_count' => 8,
        'is_active' => true,
        'base_price' => 50,
        'markup_price' => 0,
    ]);

    /** @var User $user */
    $user = User::factory()->create();
    actingAs($user, 'api');

    $billing = ShippingAddress::query()->create([
        'user_id' => $user->id,
        'address_type' => 'billing',
        'first_name' => 'Kevin',
        'last_name' => 'Gilbert',
        'address_line1' => 'Road 10',
        'country' => 'Bangladesh',
        'state' => 'Dhaka',
        'city' => 'Dhaka',
        'zip_code' => '1207',
        'email' => 'kevin@example.com',
        'phone' => '+8801234567890',
        'is_default' => true,
    ]);

    $shipping = ShippingAddress::query()->create([
        'user_id' => $user->id,
        'address_type' => 'shipping',
        'first_name' => 'Kevin',
        'last_name' => 'Gilbert',
        'address_line1' => 'Road 10',
        'country' => 'Bangladesh',
        'state' => 'Dhaka',
        'city' => 'Dhaka',
        'zip_code' => '1207',
        'email' => 'kevin@example.com',
        'phone' => '+8801234567890',
        'is_default' => true,
    ]);

    postJson('/api/store/cart/items', [
        'sku_code' => $sku->code,
        'quantity' => 2,
    ])->assertStatus(200);

    $checkoutResponse = postJson('/api/store/checkout/place-order', [
        'payment_method' => 'cash_on_delivery',
        'billing_address_id' => $billing->id,
        'shipping_address_id' => $shipping->id,
        'notes' => 'Leave at front desk',
    ]);

    $checkoutResponse
        ->assertStatus(201)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.order.status', 'confirmed')
        ->assertJsonPath('data.order.payment_status', 'cod_pending');

    $sku->refresh();
    expect((int) $sku->inventory_count)->toBe(6);

    getJson('/api/store/cart')
        ->assertStatus(200)
        ->assertJsonPath('data.cart.item_count', 0);
});

test('authenticated user can buy using qty and single address aliases', function () {
    $product = Product::factory()->create([
        'title' => 'Desk Lamp',
        'is_active' => true,
        'base_price' => 40,
        'markup_price' => 0,
    ]);

    $sku = Sku::factory()->create([
        'product_id' => $product->id,
        'inventory_count' => 6,
        'is_active' => true,
        'base_price' => 40,
        'markup_price' => 0,
    ]);

    /** @var User $user */
    $user = User::factory()->create();
    actingAs($user, 'api');

    $address = ShippingAddress::query()->create([
        'user_id' => $user->id,
        'address_type' => 'shipping',
        'first_name' => 'Rafi',
        'last_name' => 'Ahmed',
        'address_line1' => 'Road 11',
        'country' => 'Bangladesh',
        'state' => 'Dhaka',
        'city' => 'Dhaka',
        'zip_code' => '1212',
        'email' => 'rafi@example.com',
        'phone' => '+8801888888888',
        'is_default' => true,
    ]);

    postJson('/api/store/cart/items', [
        'sku_code' => $sku->code,
        'qty' => 1,
    ])
        ->assertStatus(200)
        ->assertJsonPath('data.cart.item_count', 1);

    $checkoutResponse = postJson('/api/store/checkout/place-order', [
        'payment_method' => 'cod',
        'address_id' => $address->id,
    ]);

    $checkoutResponse
        ->assertStatus(201)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.order.status', 'confirmed')
        ->assertJsonPath('data.order.payment_status', 'cod_pending');

    $sku->refresh();
    expect((int) $sku->inventory_count)->toBe(5);
});

test('authenticated user can place stripe order and receive payment intent payload', function () {
    $product = Product::factory()->create([
        'title' => 'Smart Watch',
        'is_active' => true,
        'base_price' => 199,
        'markup_price' => 0,
    ]);

    $sku = Sku::factory()->create([
        'product_id' => $product->id,
        'inventory_count' => 5,
        'is_active' => true,
        'base_price' => 199,
        'markup_price' => 0,
    ]);

    /** @var User $user */
    $user = User::factory()->create();
    actingAs($user, 'api');

    $billing = ShippingAddress::query()->create([
        'user_id' => $user->id,
        'address_type' => 'billing',
        'first_name' => 'Kevin',
        'last_name' => 'Gilbert',
        'address_line1' => 'Road 10',
        'country' => 'Bangladesh',
        'state' => 'Dhaka',
        'city' => 'Dhaka',
        'zip_code' => '1207',
        'email' => 'kevin@example.com',
        'phone' => '+8801234567890',
        'is_default' => true,
    ]);

    $shipping = ShippingAddress::query()->create([
        'user_id' => $user->id,
        'address_type' => 'shipping',
        'first_name' => 'Kevin',
        'last_name' => 'Gilbert',
        'address_line1' => 'Road 10',
        'country' => 'Bangladesh',
        'state' => 'Dhaka',
        'city' => 'Dhaka',
        'zip_code' => '1207',
        'email' => 'kevin@example.com',
        'phone' => '+8801234567890',
        'is_default' => true,
    ]);

    postJson('/api/store/cart/items', [
        'sku_code' => $sku->code,
        'quantity' => 1,
    ])->assertStatus(200);

    $stripeServiceMock = Mockery::mock(StripeOrderPaymentService::class);
    $stripeServiceMock->shouldReceive('createPaymentIntent')
        ->once()
        ->andReturn([
            'id' => 'pi_test_123',
            'status' => 'requires_payment_method',
            'client_secret' => 'pi_test_123_secret_abc',
            'amount' => 19900,
            'currency' => 'usd',
            'metadata' => ['order_id' => '1'],
            'raw' => ['id' => 'pi_test_123', 'status' => 'requires_payment_method'],
        ]);

    app()->instance(StripeOrderPaymentService::class, $stripeServiceMock);

    $checkoutResponse = postJson('/api/store/checkout/place-order', [
        'payment_method' => 'stripe',
        'billing_address_id' => $billing->id,
        'shipping_address_id' => $shipping->id,
    ]);

    $checkoutResponse
        ->assertStatus(201)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.order.status', 'pending')
        ->assertJsonPath('data.order.payment_status', 'unpaid')
        ->assertJsonPath('data.payment.payment_intent_id', 'pi_test_123')
        ->assertJsonPath('data.payment.client_secret', 'pi_test_123_secret_abc');

    $sku->refresh();
    expect((int) $sku->inventory_count)->toBe(5);
});
