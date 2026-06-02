<?php

namespace Modules\Monetization\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Monetization\Models\Plan;

class PlansSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Monthly Pro',
                'slug' => 'monthly-pro',
                'final_price' => 19.99,
                'currency' => 'USD',
                'apple_product_id' => 'com.yourapp.pro.monthly',
                'google_product_id' => 'pro_monthly_subscription',
                'features' => [
                    'Access to all basic features',
                    'Up to 10 projects',
                    'Standard email support',
                    'No ads',
                ],
                'billing_interval' => 'monthly',
                'trial_days' => 14,
                'is_recommended' => false,
                'status' => 'active',
            ],
            [
                'name' => 'Yearly Premium',
                'slug' => 'yearly-premium',
                'final_price' => 199.99, // Usually offers a discount compared to monthly
                'currency' => 'USD',
                'apple_product_id' => 'com.yourapp.premium.yearly',
                'google_product_id' => 'premium_yearly_subscription',
                'features' => [
                    'Everything in Monthly Pro',
                    'Unlimited projects',
                    'Priority 24/7 support',
                    'Custom analytics & reports',
                    'Save 15% annually',
                ],
                'billing_interval' => 'yearly',
                'trial_days' => 14,
                'is_recommended' => true, // Often yearly plans are recommended
                'status' => 'active',
            ],
            [
                'name' => 'Lifetime Founder',
                'slug' => 'lifetime-founder',
                'final_price' => 499.99,
                'currency' => 'USD',
                'apple_product_id' => 'com.yourapp.founder.lifetime',
                'google_product_id' => 'founder_lifetime_access',
                'features' => [
                    'Pay once, access forever',
                    'All Yearly Premium features',
                    'Early access to new updates',
                    'Dedicated account manager',
                ],
                'billing_interval' => 'lifetime',
                'trial_days' => 0, // Lifetime usually doesn't have trials
                'is_recommended' => false,
                'status' => 'active',
            ],
        ];

        foreach ($plans as $planData) {
            Plan::updateOrCreate(
                // The unique identifier to check if it already exists
                ['slug' => $planData['slug']], 
                // The data to insert/update
                $planData
            );
        }
    }
}
