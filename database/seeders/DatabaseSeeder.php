<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Monetization\Database\Seeders\MonetizationDatabaseSeeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            UserSeeder::class,
            MonetizationDatabaseSeeder::class,
        ]);
    }
}
