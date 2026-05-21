<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'admin.panel.access',
            'admin.manage.settings',

            'product.view',
            'product.create',
            'product.update',
            'product.delete',

            'order.view',
            'order.create',
            'order.cancel',

            'inventory.view',
            'inventory.update',
        ];

        /*
        |--------------------------------------------------------------------------
        | Create Permissions
        |--------------------------------------------------------------------------
        */

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Roles
        |--------------------------------------------------------------------------
        */

        $superAdmin = Role::firstOrCreate([
            'name' => 'super-admin',
            'guard_name' => 'web',
        ]);

        $admin = Role::firstOrCreate([
            'name' => 'admin',
            'guard_name' => 'web',
        ]);

        $seller = Role::firstOrCreate([
            'name' => 'seller',
            'guard_name' => 'web',
        ]);

        $user = Role::firstOrCreate([
            'name' => 'user',
            'guard_name' => 'web',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Assign Permissions
        |--------------------------------------------------------------------------
        */

        $superAdmin->syncPermissions(Permission::pluck('name'));

        $admin->syncPermissions(Permission::pluck('name'));

        $seller->syncPermissions([
            'product.view',
            'product.create',
            'product.update',
            'inventory.view',
            'inventory.update',
        ]);

        $user->syncPermissions([
            'order.create',
            'order.view',
        ]);
    }
}
