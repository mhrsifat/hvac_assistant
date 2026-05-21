<?php

use App\Models\BusinessDetail;
use App\Models\Store;
use App\Models\SubscriptionAndPayment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('seller can register and is created with pending seller_status and related records', function () {
    Mail::fake();

    Role::firstOrCreate(['name' => 'seller', 'guard_name' => 'web']);

    $payload = [
        'first_name' => 'John',
        'last_name' => 'Doe',
        'email' => 'seller@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'phone' => '1234567890',
        'terms_and_conditions' => true,

        'business_type' => 'Individual',
        'company_name' => null,
        'tax_id_or_reg_number' => null,
        'industry_category' => 'Retail',
        'country' => 'US',
        'state' => 'CA',
        'city' => 'LA',
        'zip_code' => '90001',
        'address_line' => 'Street 1',
        'nid_document_url' => '/uploads/nid.png',

        'payout_method' => 'Bank_Transfer',
        'stripe_account_id' => null,
        'account_holder_name' => 'John Doe',
        'bank_name' => 'My Bank',
        'account_number' => '123456',
        'swift_routing_code' => 'SWIFT123',
        'payout_frequency' => 'Monthly',

        'store_name' => 'john-store',
        'store_description' => 'My store description',
        'store_logo_url' => '/uploads/logo.png',
        'contact_email' => 'contact@seller.com',
        'contact_phone' => '111222333',
    ];

    $response = $this->postJson('/api/auth/seller/register', $payload);

    $response
        ->assertStatus(201)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.user.email', 'seller@example.com')
        ->assertJsonPath('data.user.seller_status', 'pending')
        ->assertJsonStructure(['data' => ['otp_token']]);

    $user = User::query()->where('email', 'seller@example.com')->firstOrFail();

    expect($user->seller_status)->toBe('pending');
    expect($user->hasRole('seller'))->toBeTrue();

    expect(BusinessDetail::query()->where('user_id', $user->id)->exists())->toBeTrue();
    expect(SubscriptionAndPayment::query()->where('user_id', $user->id)->exists())->toBeTrue();

    $store = Store::query()->where('user_id', $user->id)->firstOrFail();
    expect($store->is_active)->toBeFalse();
});

test('admin can approve a pending seller', function () {
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'seller', 'guard_name' => 'web']);

    $admin = User::create([
        'first_name' => 'Admin',
        'last_name' => 'User',
        'email' => 'admin@example.com',
        'password' => 'password123',
        'phone' => '999999999',
    ]);
    $admin->assignRole('admin');

    $seller = User::create([
        'first_name' => 'Seller',
        'last_name' => 'User',
        'email' => 'pending-seller@example.com',
        'password' => 'password123',
        'phone' => '888888888',
        'seller_status' => 'pending',
    ]);
    $seller->assignRole('seller');

    Store::create([
        'user_id' => $seller->id,
        'store_name' => 'pending-store',
        'contact_email' => 'pending-store@example.com',
        'is_active' => false,
    ]);

    $response = $this
        ->actingAs($admin, 'api')
        ->postJson("/api/admin/sellers/{$seller->id}/approve");

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.user.seller_status', 'approved');

    $seller->refresh();

    expect($seller->seller_status)->toBe('approved');
    expect($seller->seller_approved_at)->not->toBeNull();
    expect($seller->store->refresh()->is_active)->toBeTrue();
});
