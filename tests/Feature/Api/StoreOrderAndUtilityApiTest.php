<?php

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

test('authenticated user can manage addresses wishlist and compare list', function () {
    $product = Product::factory()->create([
        'title' => 'Bluetooth Speaker',
        'is_active' => true,
    ]);

    $sku = Sku::factory()->create([
        'product_id' => $product->id,
        'inventory_count' => 7,
        'is_active' => true,
    ]);

    /** @var User $user */
    $user = User::factory()->create();
    actingAs($user, 'api');

    $createAddressResponse = postJson('/api/store/addresses', [
        'address_type' => 'shipping',
        'first_name' => 'Alexa',
        'last_name' => 'Jones',
        'address_line1' => 'House 10',
        'country' => 'Bangladesh',
        'state' => 'Dhaka',
        'city' => 'Dhaka',
        'zip_code' => '1207',
        'email' => 'alexa@example.com',
        'phone' => '+8801712345678',
        'is_default' => true,
    ]);

    $createAddressResponse
        ->assertStatus(201)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.address.address_type', 'shipping')
        ->assertJsonPath('data.address.is_default', true);

    $addressId = (int) $createAddressResponse->json('data.address.id');

    putJson('/api/store/addresses/'.$addressId, [
        'first_name' => 'Alex',
        'city' => 'Narayanganj',
    ])
        ->assertStatus(200)
        ->assertJsonPath('data.address.first_name', 'Alex')
        ->assertJsonPath('data.address.city', 'Narayanganj');

    getJson('/api/store/addresses')
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonCount(1, 'data.addresses');

    postJson('/api/store/wishlist/items', [
        'sku_code' => $sku->code,
    ])
        ->assertStatus(200)
        ->assertJsonPath('success', true);

    getJson('/api/store/wishlist')
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonCount(1, 'data.items');

    postJson('/api/store/compare/items', [
        'product_id' => $product->id,
    ])
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.total_items', 1);

    getJson('/api/store/compare')
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonCount(1, 'data.items');

    deleteJson('/api/store/wishlist/items/'.$sku->code)
        ->assertStatus(200)
        ->assertJsonPath('success', true);

    deleteJson('/api/store/compare/items/'.$product->id)
        ->assertStatus(200)
        ->assertJsonPath('success', true);

    getJson('/api/store/wishlist')
        ->assertStatus(200)
        ->assertJsonCount(0, 'data.items');

    getJson('/api/store/compare')
        ->assertStatus(200)
        ->assertJsonCount(0, 'data.items');
});

test('authenticated user can fetch order details overview and cancel cod order', function () {
    $product = Product::factory()->create([
        'title' => 'Studio Headset',
        'is_active' => true,
        'base_price' => 80,
        'markup_price' => 0,
    ]);

    $sku = Sku::factory()->create([
        'product_id' => $product->id,
        'inventory_count' => 9,
        'is_active' => true,
        'base_price' => 80,
        'markup_price' => 0,
    ]);

    /** @var User $user */
    $user = User::factory()->create();
    actingAs($user, 'api');

    $billing = ShippingAddress::query()->create([
        'user_id' => $user->id,
        'address_type' => 'billing',
        'first_name' => 'Maria',
        'last_name' => 'Khan',
        'address_line1' => 'Block C',
        'country' => 'Bangladesh',
        'state' => 'Dhaka',
        'city' => 'Dhaka',
        'zip_code' => '1212',
        'email' => 'maria@example.com',
        'phone' => '+8801700000000',
        'is_default' => true,
    ]);

    $shipping = ShippingAddress::query()->create([
        'user_id' => $user->id,
        'address_type' => 'shipping',
        'first_name' => 'Maria',
        'last_name' => 'Khan',
        'address_line1' => 'Block C',
        'country' => 'Bangladesh',
        'state' => 'Dhaka',
        'city' => 'Dhaka',
        'zip_code' => '1212',
        'email' => 'maria@example.com',
        'phone' => '+8801700000000',
        'is_default' => true,
    ]);

    postJson('/api/store/cart/items', [
        'sku_code' => $sku->code,
        'quantity' => 2,
    ])->assertStatus(200);

    $placeOrderResponse = postJson('/api/store/checkout/place-order', [
        'payment_method' => 'cash_on_delivery',
        'billing_address_id' => $billing->id,
        'shipping_address_id' => $shipping->id,
    ]);

    $placeOrderResponse
        ->assertStatus(201)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.order.status', 'confirmed')
        ->assertJsonPath('data.order.payment_status', 'cod_pending');

    $orderId = (int) $placeOrderResponse->json('data.order.id');

    getJson('/api/store/orders/status-overview')
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.overview.total_orders', 1)
        ->assertJsonPath('data.overview.pending_orders', 1);

    getJson('/api/store/orders')
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonCount(1, 'data.orders');

    getJson('/api/store/orders/'.$orderId)
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.order.id', $orderId);

    getJson('/api/store/orders/'.$orderId.'/track')
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.order_id', $orderId);

    postJson('/api/store/orders/'.$orderId.'/cancel')
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.order.status', 'cancelled')
        ->assertJsonPath('data.order.payment_status', 'cancelled');

    $sku->refresh();
    expect((int) $sku->inventory_count)->toBe(9);
});

test('authenticated user can confirm stripe order payment and stock is deducted', function () {
    $product = Product::factory()->create([
        'title' => 'Gaming Mouse',
        'is_active' => true,
        'base_price' => 60,
        'markup_price' => 0,
    ]);

    $sku = Sku::factory()->create([
        'product_id' => $product->id,
        'inventory_count' => 4,
        'is_active' => true,
        'base_price' => 60,
        'markup_price' => 0,
    ]);

    /** @var User $user */
    $user = User::factory()->create();
    actingAs($user, 'api');

    $billing = ShippingAddress::query()->create([
        'user_id' => $user->id,
        'address_type' => 'billing',
        'first_name' => 'Nora',
        'last_name' => 'Ahmed',
        'address_line1' => 'Sector 5',
        'country' => 'Bangladesh',
        'state' => 'Dhaka',
        'city' => 'Dhaka',
        'zip_code' => '1216',
        'email' => 'nora@example.com',
        'phone' => '+8801700000001',
        'is_default' => true,
    ]);

    $shipping = ShippingAddress::query()->create([
        'user_id' => $user->id,
        'address_type' => 'shipping',
        'first_name' => 'Nora',
        'last_name' => 'Ahmed',
        'address_line1' => 'Sector 5',
        'country' => 'Bangladesh',
        'state' => 'Dhaka',
        'city' => 'Dhaka',
        'zip_code' => '1216',
        'email' => 'nora@example.com',
        'phone' => '+8801700000001',
        'is_default' => true,
    ]);

    postJson('/api/store/cart/items', [
        'sku_code' => $sku->code,
        'quantity' => 2,
    ])->assertStatus(200);

    $stripeServiceMock = Mockery::mock(StripeOrderPaymentService::class);
    $stripeServiceMock->shouldReceive('createPaymentIntent')
        ->once()
        ->andReturn([
            'id' => 'pi_confirm_123',
            'status' => 'requires_payment_method',
            'client_secret' => 'pi_confirm_123_secret',
            'amount' => 12000,
            'currency' => 'usd',
            'metadata' => ['order_id' => '1'],
            'raw' => ['id' => 'pi_confirm_123', 'status' => 'requires_payment_method'],
        ]);

    $stripeServiceMock->shouldReceive('retrievePaymentIntent')
        ->once()
        ->with('pi_confirm_123')
        ->andReturn([
            'id' => 'pi_confirm_123',
            'status' => 'succeeded',
            'amount' => 12000,
            'currency' => 'usd',
            'metadata' => ['order_id' => '1'],
            'raw' => ['id' => 'pi_confirm_123', 'status' => 'succeeded'],
        ]);

    app()->instance(StripeOrderPaymentService::class, $stripeServiceMock);

    $placeOrderResponse = postJson('/api/store/checkout/place-order', [
        'payment_method' => 'stripe',
        'billing_address_id' => $billing->id,
        'shipping_address_id' => $shipping->id,
    ]);

    $placeOrderResponse
        ->assertStatus(201)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.order.status', 'pending')
        ->assertJsonPath('data.order.payment_status', 'unpaid')
        ->assertJsonPath('data.payment.payment_intent_id', 'pi_confirm_123');

    $orderId = (int) $placeOrderResponse->json('data.order.id');

    postJson('/api/store/orders/'.$orderId.'/payments/stripe/confirm', [
        'payment_intent_id' => 'pi_confirm_123',
    ])
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.order.payment_status', 'paid')
        ->assertJsonPath('data.order.status', 'confirmed')
        ->assertJsonPath('data.payment.status', 'succeeded');

    $sku->refresh();
    expect((int) $sku->inventory_count)->toBe(2);
});
