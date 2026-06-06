<?php

namespace Database\Seeders;

use App\Models\Brand;
use Illuminate\Database\Seeder;

class BrandSeeder extends Seeder
{
    public function run(): void
    {
        $brands = [
            ['name' => 'Samsung'],
            ['name' => 'LG'],
            ['name' => 'Panasonic'],
        ];

        foreach ($brands as $brand) {
            Brand::firstOrCreate([
                'name' => $brand['name'],
            ]);
        }
    }
}
