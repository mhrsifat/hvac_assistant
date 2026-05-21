<?php

use App\Models\User;
use App\Services\Api\Settings\SettingsService;
use Spatie\Permission\Models\Role;

test('admin can fetch available ai providers', function () {
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);

    $admin = User::factory()->create();
    $admin->assignRole($adminRole);

    $serviceMock = Mockery::mock(SettingsService::class);
    $serviceMock->shouldReceive('listAvailableAiProviders')
        ->once()
        ->andReturn([
            ['name' => 'openai', 'label' => 'OpenAI'],
            ['name' => 'gemini', 'label' => 'Gemini'],
        ]);

    app()->instance(SettingsService::class, $serviceMock);

    $response = $this
        ->actingAs($admin, 'api')
        ->getJson('/api/settings/ai/providers');

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonCount(2, 'data.providers')
        ->assertJsonPath('data.providers.0.name', 'openai')
        ->assertJsonPath('data.providers.1.name', 'gemini');
});

test('admin can set ai provider api key', function () {
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);

    $admin = User::factory()->create();
    $admin->assignRole($adminRole);

    $serviceMock = Mockery::mock(SettingsService::class);
    $serviceMock->shouldReceive('setAiProviderApiKey')
        ->once()
        ->with('openai', 'secret-test-key')
        ->andReturn(true);

    app()->instance(SettingsService::class, $serviceMock);

    $response = $this
        ->actingAs($admin, 'api')
        ->postJson('/api/settings/ai/set-key', [
            'provider' => 'openai',
            'key' => 'secret-test-key',
        ]);

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'AI provider API key updated successfully.');
});

test('admin can update smtp settings', function () {
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);

    $admin = User::factory()->create();
    $admin->assignRole($adminRole);

    $serviceMock = Mockery::mock(SettingsService::class);
    $serviceMock->shouldReceive('updateSmtpSettings')
        ->once()
        ->with(Mockery::subset([
            'mail_mailer' => 'smtp',
            'mail_host' => 'smtp.mailtrap.io',
            'mail_port' => 2525,
            'mail_from_address' => 'admin@example.com',
            'mail_from_name' => 'Admin Mail',
        ]));

    app()->instance(SettingsService::class, $serviceMock);

    $response = $this
        ->actingAs($admin, 'api')
        ->postJson('/api/settings/smtp-settings', [
            'mail_mailer' => 'smtp',
            'mail_host' => 'smtp.mailtrap.io',
            'mail_port' => 2525,
            'mail_username' => 'mail-user',
            'mail_password' => 'mail-password',
            'mail_from_address' => 'admin@example.com',
            'mail_from_name' => 'Admin Mail',
            'mail_encryption' => 'tls',
        ]);

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'SMTP settings updated successfully.');
});
