<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->decimal('final_price', 10, 2);
            $table->decimal('original_price', 10, 2)->nullable();
            $table->string('currency', 3)->default('USD');

            // Added individual indexes for rapid webhook resolution
            $table->string('apple_product_id')->nullable()->index();
            $table->string('google_product_id')->nullable()->index();
            $table->string('stripe_product_id')->nullable()->index();
            $table->string('stripe_price_id')->nullable()->index();

            $table->json('features')->nullable();
            $table->enum('billing_interval', ['daily', 'weekly', 'monthly', 'yearly', 'lifetime']);
            $table->integer('trial_days')->default(0);
            $table->boolean('is_recommended')->default(false);
            $table->enum('status', ['active', 'inactive'])->default('active');

            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
