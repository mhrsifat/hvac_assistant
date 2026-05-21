<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\View;
use Inertia\Middleware; // Cache ফ্যাসাদ যুক্ত করা হয়েছে
use Modules\Settings\Models\SystemSetting;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $roles = [];
        $permissions = [];
        try {
            $currentAppName = (string) config('app.name');
        } catch (\Throwable) {
            $currentAppName = 'Laravel';
        }

        $system = Cache::rememberForever('system_settings', function () {
            return SystemSetting::current()->toArray();
        });

        try {
            config(['app.name' => $system['system_name'] ?? $currentAppName]);
        } catch (\Throwable) {
            // Ignore when the config repository is unavailable in test bootstrap paths.
        }
        View::share('system', $system);

        if ($user) {
            // Caching roles for 24 hours to prevent heavy DB queries (ডেটাবেস কুয়েরি কমানোর জন্য ক্যাশিং)
            $roles = Cache::remember("user_roles_{$user->id}", now()->addHours(24), function () use ($user) {
                return $user->getRoleNames()->values()->all();
            });

            // Caching permissions for 24 hours
            $permissions = Cache::remember("user_permissions_{$user->id}", now()->addHours(24), function () use ($user) {
                return $user->getAllPermissions()->pluck('name')->values()->all();
            });
        }

        return [
            ...parent::share($request),

            // Official Inertia app name configuration
            'name' => $system['system_name'] ?? $currentAppName,

            'system' => $system,

            // Merged official Auth array with our robust Spatie data
            'auth' => [
                'user' => $user,
                'roles' => $roles,
                'permissions' => $permissions,
            ],

            // Official sidebar cookie state tracking
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',

            // Flash messages for robust CRUD operations (CRUD অপারেশনের সফলতার মেসেজ দেখানোর জন্য)
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
