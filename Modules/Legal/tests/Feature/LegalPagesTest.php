<?php

use App\Models\User;
use Modules\Legal\Models\StaticPage;
use Spatie\Permission\Models\Role;

beforeEach(function (): void {
    Role::firstOrCreate([
        'name' => 'admin',
        'guard_name' => 'web',
    ]);

    Role::firstOrCreate([
        'name' => 'super-admin',
        'guard_name' => 'web',
    ]);

    Role::firstOrCreate([
        'name' => 'user',
        'guard_name' => 'web',
    ]);
});

dataset('editable static pages', [
    ['static-pages.privacy-policy.update', 'privacy-policy', 'Privacy Policy', '<p>Updated privacy policy</p>'],
    ['static-pages.terms-and-conditions.update', 'terms-and-conditions', 'Terms and Conditions', '<p>Updated terms and conditions</p>'],
]);

test('admin users can update static page content', function (string $routeName, string $slug, string $title, string $body): void {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $this->actingAs($user);

    $response = $this->post(route($routeName), [
        'title' => $title,
        'status' => 'published',
        'content' => $body,
    ]);

    $response->assertRedirect();

    $staticPage = StaticPage::where('slug', $slug)->firstOrFail();

    expect($staticPage->title)->toBe($title);
    expect($staticPage->status)->toBe('published');
    expect(data_get($staticPage->content, 'body'))->toBe($body);
})->with('editable static pages');

test('non admin users cannot update static page content', function (string $routeName, string $slug, string $title, string $body): void {
    $user = User::factory()->create();
    $user->assignRole('user');

    $this->actingAs($user);

    $response = $this->post(route($routeName), [
        'title' => $title,
        'status' => 'published',
        'content' => $body,
    ]);

    $response->assertForbidden();
})->with('editable static pages');
