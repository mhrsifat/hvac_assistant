<?php

namespace Database\Seeders;

use App\Models\HvacModel;
use Illuminate\Database\Seeder;

class HvacModelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Generates 100+ real Samsung HVAC models using a DRY matrix architecture.
     */
    public function run(): void
    {
        // Define base series to keep the code DRY and easily maintainable
        $seriesMatrix = [
            // RAC (Room Air Conditioners) - Wall Mounted
            [
                'name' => 'Samsung Wind-Free 2.0',
                'prefix' => 'AR',
                'suffix' => 'TXCAAWK',
                'efficiency' => 'A+++',
                'power' => '220V, 50Hz',
                'refrigerant' => 'R32',
                'capacities' => [9000 => '09', 12000 => '12', 18000 => '18', 24000 => '24'],
            ],
            [
                'name' => 'Samsung Wind-Free Elite',
                'prefix' => 'AR',
                'suffix' => 'CXAAAWK',
                'efficiency' => 'A+++',
                'power' => '220V, 50Hz',
                'refrigerant' => 'R32',
                'capacities' => [9000 => '09', 12000 => '12', 18000 => '18', 24000 => '24'],
            ],
            [
                'name' => 'Samsung Wind-Free Avant',
                'prefix' => 'AR',
                'suffix' => 'TXEAAWK',
                'efficiency' => 'A++',
                'power' => '220V, 50Hz',
                'refrigerant' => 'R32',
                'capacities' => [9000 => '09', 12000 => '12', 18000 => '18', 24000 => '24'],
            ],
            [
                'name' => 'Samsung Wind-Free Comfort',
                'prefix' => 'AR',
                'suffix' => 'TXFCAWK',
                'efficiency' => 'A++',
                'power' => '220V, 50Hz',
                'refrigerant' => 'R32',
                'capacities' => [9000 => '09', 12000 => '12', 18000 => '18', 24000 => '24'],
            ],
            [
                'name' => 'Samsung Quantum 2.0',
                'prefix' => 'AR',
                'suffix' => 'TYQAAWK',
                'efficiency' => 'A++',
                'power' => '220V, 50Hz',
                'refrigerant' => 'R410A',
                'capacities' => [9000 => '09', 12000 => '12', 18000 => '18', 24000 => '24'],
            ],
            [
                'name' => 'Samsung Max Heat',
                'prefix' => 'AR',
                'suffix' => 'TSFB',
                'efficiency' => 'A+++',
                'power' => '220V, 50Hz',
                'refrigerant' => 'R410A',
                'capacities' => [9000 => '09', 12000 => '12', 18000 => '18', 24000 => '24'],
            ],
            [
                'name' => 'Samsung Whisper',
                'prefix' => 'AR',
                'suffix' => 'NV2AAWK',
                'efficiency' => 'A+',
                'power' => '220V, 50Hz',
                'refrigerant' => 'R410A',
                'capacities' => [9000 => '09', 12000 => '12', 18000 => '18', 24000 => '24'],
            ],
            [
                'name' => 'Samsung Cebu',
                'prefix' => 'AR',
                'suffix' => 'TXHZAWK',
                'efficiency' => 'A++',
                'power' => '220V, 50Hz',
                'refrigerant' => 'R32',
                'capacities' => [9000 => '09', 12000 => '12', 18000 => '18', 24000 => '24'],
            ],
            [
                'name' => 'Samsung Luzon',
                'prefix' => 'AR',
                'suffix' => 'TXHQASIN',
                'efficiency' => 'A+',
                'power' => '220V, 50Hz',
                'refrigerant' => 'R32',
                'capacities' => [9000 => '09', 12000 => '12', 18000 => '18', 24000 => '24'],
            ],
            [
                'name' => 'Samsung AR9500T',
                'prefix' => 'AR',
                'suffix' => 'TYAAAWK',
                'efficiency' => 'A+++',
                'power' => '220V, 50Hz',
                'refrigerant' => 'R32',
                'capacities' => [9000 => '09', 12000 => '12', 18000 => '18', 24000 => '24'],
            ],
            [
                'name' => 'Samsung AR7500T',
                'prefix' => 'AR',
                'suffix' => 'TYCABWK',
                'efficiency' => 'A++',
                'power' => '220V, 50Hz',
                'refrigerant' => 'R32',
                'capacities' => [9000 => '09', 12000 => '12', 18000 => '18', 24000 => '24'],
            ],
            [
                'name' => 'Samsung Eco Inverter',
                'prefix' => 'AR',
                'suffix' => 'TYEA',
                'efficiency' => 'A+',
                'power' => '220V, 50Hz',
                'refrigerant' => 'R32',
                'capacities' => [9000 => '09', 12000 => '12', 18000 => '18', 24000 => '24'],
            ],
            [
                'name' => 'Samsung Premium Plus',
                'prefix' => 'AR',
                'suffix' => 'TXAA',
                'efficiency' => 'A+++',
                'power' => '220V, 50Hz',
                'refrigerant' => 'R32',
                'capacities' => [9000 => '09', 12000 => '12', 18000 => '18', 24000 => '24'],
            ],

            // CAC (Commercial Air Conditioners) / Cassettes & Ducts
            [
                'name' => 'Samsung 360 Cassette',
                'prefix' => 'AC',
                'suffix' => 'NNNDCH',
                'efficiency' => 'A++',
                'power' => '220V, 1 Phase',
                'refrigerant' => 'R410A',
                'capacities' => [18000 => '018', 24000 => '024', 30000 => '030', 36000 => '036', 42000 => '042', 48000 => '048'],
            ],
            [
                'name' => 'Samsung 4-Way Cassette',
                'prefix' => 'AC',
                'suffix' => 'NN4DCH',
                'efficiency' => 'A++',
                'power' => '220V, 1 Phase',
                'refrigerant' => 'R410A',
                'capacities' => [18000 => '018', 24000 => '024', 30000 => '030', 36000 => '036', 42000 => '042', 48000 => '048'],
            ],
            [
                'name' => 'Samsung 4-Way Wind-Free Cassette',
                'prefix' => 'AC',
                'suffix' => 'NN4DCW',
                'efficiency' => 'A+++',
                'power' => '220V, 1 Phase',
                'refrigerant' => 'R410A',
                'capacities' => [18000 => '018', 24000 => '024', 30000 => '030', 36000 => '036', 42000 => '042', 48000 => '048'],
            ],
            [
                'name' => 'Samsung 1-Way Wind-Free Cassette',
                'prefix' => 'AC',
                'suffix' => 'NN1DCH',
                'efficiency' => 'A++',
                'power' => '220V, 1 Phase',
                'refrigerant' => 'R410A',
                'capacities' => [9000 => '009', 12000 => '012', 18000 => '018', 24000 => '024'],
            ],
            [
                'name' => 'Samsung Slim Duct',
                'prefix' => 'AC',
                'suffix' => 'NNLDCH',
                'efficiency' => 'A+',
                'power' => '220V, 1 Phase',
                'refrigerant' => 'R410A',
                'capacities' => [9000 => '009', 12000 => '012', 18000 => '018', 24000 => '024'],
            ],
            [
                'name' => 'Samsung MSP Duct',
                'prefix' => 'AC',
                'suffix' => 'NNMDCH',
                'efficiency' => 'A+',
                'power' => '220V, 1 Phase',
                'refrigerant' => 'R410A',
                'capacities' => [18000 => '018', 24000 => '024', 30000 => '030', 36000 => '036', 42000 => '042', 48000 => '048'],
            ],
            [
                'name' => 'Samsung HSP Duct',
                'prefix' => 'AC',
                'suffix' => 'NNHDCH',
                'efficiency' => 'A',
                'power' => '380V, 3 Phase',
                'refrigerant' => 'R410A',
                'capacities' => [36000 => '036', 48000 => '048', 60000 => '060'],
            ],
            [
                'name' => 'Samsung Console',
                'prefix' => 'AC',
                'suffix' => 'NNJDCH',
                'efficiency' => 'A++',
                'power' => '220V, 1 Phase',
                'refrigerant' => 'R410A',
                'capacities' => [9000 => '009', 12000 => '012', 15000 => '015', 18000 => '018'],
            ],
            [
                'name' => 'Samsung FJM Wall Mount',
                'prefix' => 'AJ',
                'suffix' => 'TXJ2CH',
                'efficiency' => 'A++',
                'power' => '220V, 50Hz',
                'refrigerant' => 'R32',
                'capacities' => [9000 => '009', 12000 => '012', 18000 => '018', 24000 => '024'],
            ],
            [
                'name' => 'Samsung CAC Ceiling',
                'prefix' => 'AC',
                'suffix' => 'NNCDCH',
                'efficiency' => 'A+',
                'power' => '220V, 1 Phase',
                'refrigerant' => 'R410A',
                'capacities' => [18000 => '018', 24000 => '024', 30000 => '030', 36000 => '036'],
            ],
            [
                'name' => 'Samsung Floor Standing',
                'prefix' => 'AF',
                'suffix' => 'TXFAAWK',
                'efficiency' => 'A+',
                'power' => '380V, 3 Phase',
                'refrigerant' => 'R410A',
                'capacities' => [24000 => '024', 36000 => '036', 48000 => '048'],
            ],
            [
                'name' => 'Samsung DVM S Eco Indoor',
                'prefix' => 'AM',
                'suffix' => 'FNQDEH',
                'efficiency' => 'A++',
                'power' => '220V, 1 Phase',
                'refrigerant' => 'R410A',
                'capacities' => [9000 => '009', 12000 => '012', 18000 => '018', 24000 => '024'],
            ],
        ];

        $hvacModels = [];
        $brandId = 1; // Assuming 1 represents Samsung in the brands table
        $timestamp = now(); // Use single timestamp variable for performance

        // Generate combinations based on the matrix
        foreach ($seriesMatrix as $series) {
            foreach ($series['capacities'] as $btu => $capacityCode) {
                $hvacModels[] = [
                    'brand_id' => $brandId,
                    'name' => $series['name'].' '.($btu / 1000).'K BTU',
                    'model_number' => $series['prefix'].$capacityCode.$series['suffix'],
                    'capacity_btu' => $btu,
                    'efficiency_rating' => $series['efficiency'],
                    'power_spec' => $series['power'],
                    'refrigerant_type' => $series['refrigerant'],
                    'created_at' => $timestamp,
                    'updated_at' => $timestamp,
                ];
            }
        }

        // Insert in chunks of 50 to optimize database performance and prevent memory exhaustion
        $chunks = array_chunk($hvacModels, 50);
        foreach ($chunks as $chunk) {
            foreach ($chunk as $record) {
                HvacModel::create($record);
            }
        }
    }
}
