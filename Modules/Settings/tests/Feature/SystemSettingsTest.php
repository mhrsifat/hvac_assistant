<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Modules\Settings\Models\SystemSetting;
use Spatie\Permission\Models\Role;

beforeEach(function (): void {
    Role::firstOrCreate([
        'name' => 'admin',
        'guard_name' => 'web',
    ]);

    Role::firstOrCreate([
        'name' => 'user',
        'guard_name' => 'web',
    ]);
});

test('admin users can update system branding assets', function (): void {
    Storage::fake('public');

    $user = User::factory()->create();
    $user->assignRole('admin');

    $this->actingAs($user);

    $response = $this->post(route('system-settings.update'), [
        'system_name' => 'Acme Admin',
        'logo' => UploadedFile::fake()->image('logo.png'),
        'favicon' => UploadedFile::fake()->image('favicon.png'),
    ]);

    $response->assertRedirect();

    $systemSetting = SystemSetting::current();

    expect($systemSetting->system_name)->toBe('Acme Admin');
    expect($systemSetting->getRawOriginal('logo'))->not->toBeNull();
    expect($systemSetting->getRawOriginal('favicon'))->not->toBeNull();

    Storage::disk('public')->assertExists($systemSetting->getRawOriginal('logo'));
    Storage::disk('public')->assertExists($systemSetting->getRawOriginal('favicon'));
});

test('non admin users cannot update system branding', function (): void {
    $user = User::factory()->create();
    $user->assignRole('user');

    $this->actingAs($user);

    $response = $this->post(route('system-settings.update'), [
        'system_name' => 'Acme Admin',
    ]);

    $response->assertForbidden();
});
