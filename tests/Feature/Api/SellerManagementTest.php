<?php

use App\Models\BusinessDetail;
use App\Models\Store;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('admin can fetch pending seller request list', function () {
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);

    $admin = User::factory()->create();
    $admin->assignRole($adminRole);

    $pendingSeller = User::factory()->create([
        'seller_status' => 'pending',
    ]);

    $approvedSeller = User::factory()->create([
        'seller_status' => 'approved',
        'seller_approved_at' => now(),
    ]);

    $response = $this
        ->actingAs($admin, 'api')
        ->getJson('/api/seller/requests');

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonCount(1, 'data.sellers')
        ->assertJsonPath('data.sellers.0.id', $pendingSeller->id)
        ->assertJsonPath('data.sellers.0.seller_status', 'pending');

    expect($approvedSeller->id)->not->toBe($pendingSeller->id);
});

test('admin can fetch all seller list', function () {
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);

    $admin = User::factory()->create();
    $admin->assignRole($adminRole);

    User::factory()->create(['seller_status' => 'pending']);
    User::factory()->create(['seller_status' => 'approved', 'seller_approved_at' => now()]);

    User::factory()->create(['seller_status' => null]);

    $response = $this
        ->actingAs($admin, 'api')
        ->getJson('/api/seller/all');

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonCount(2, 'data.sellers');
});

test('admin can toggle seller status and store active flag', function () {
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);

    $admin = User::factory()->create();
    $admin->assignRole($adminRole);

    $seller = User::factory()->create([
        'seller_status' => 'approved',
        'seller_approved_at' => now(),
        'status' => 'active',
    ]);

    $store = Store::create([
        'user_id' => $seller->id,
        'store_name' => 'toggle-store',
        'contact_email' => 'toggle-store@example.com',
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($admin, 'api')
        ->postJson("/api/seller/toggle-status/{$seller->id}");

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true);

    $seller->refresh();
    $store->refresh();

    expect($seller->status)->toBe('inactive');
    expect($store->is_active)->toBeFalse();
});

test('admin can delete seller and related records', function () {
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);

    $admin = User::factory()->create();
    $admin->assignRole($adminRole);

    $seller = User::factory()->create([
        'seller_status' => 'pending',
    ]);

    BusinessDetail::create([
        'user_id' => $seller->id,
        'business_type' => 'Individual',
    ]);

    Subscription::create([
        'user_id' => $seller->id,
        'payout_method' => 'Bank_Transfer',
    ]);

    Store::create([
        'user_id' => $seller->id,
        'store_name' => 'delete-store',
        'contact_email' => 'delete-store@example.com',
        'is_active' => false,
    ]);

    $response = $this
        ->actingAs($admin, 'api')
        ->deleteJson("/api/seller/delete/{$seller->id}");

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true);

    $this->assertDatabaseMissing('users', ['id' => $seller->id]);
    $this->assertDatabaseMissing('business_details', ['user_id' => $seller->id]);
    $this->assertDatabaseMissing('subscriptions', ['user_id' => $seller->id]);
    $this->assertDatabaseMissing('stores', ['user_id' => $seller->id]);
});
