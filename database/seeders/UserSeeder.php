<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admins = [
            [
                'first_name' => 'Admin User',
                'email' => 'admin@admin.com',
                'password' => bcrypt('12345678'),
                'phone' => '1234567890',
                'terms_and_conditions' => true,
            ],
        ];

        foreach ($admins as $admin) {
            User::create($admin);
            $user = User::where('email', $admin['email'])->first();
            $user->assignRole('admin');
        }
    }
}
