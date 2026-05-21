<?php

use App\Models\User;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    Role::firstOrCreate([
        'name' => 'admin',
        'guard_name' => 'web',
    ]);

    Role::firstOrCreate([
        'name' => 'super-admin',
        'guard_name' => 'web',
    ]);
});

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));

    $response->assertRedirect(route('login'));
});

test('admin users can visit the dashboard', function () {
    $user = User::factory()->create();
    // add admin role first
    $user->assignRole('admin');

    $this->actingAs($user);

    $response = $this->get(route('dashboard'));

    $response->assertOk();
});

test('non admin users cannot visit the dashboard', function () {
    $user = User::factory()->create();

    $this->actingAs($user);

    $response = $this->get(route('dashboard'));

    $response->assertForbidden();
});
