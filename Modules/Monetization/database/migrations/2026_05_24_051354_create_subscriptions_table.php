<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();

            // Enforced foreign key constraints
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained()->cascadeOnDelete();

            $table->enum('status', ['active', 'canceled', 'past_due', 'trialing', 'paused']);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();

            // Added to cache trial period locally for UI display without hitting third-party APIs
            $table->timestamp('trial_ends_at')->nullable();

            $table->timestamp('cancelled_at')->nullable();

            // Reference to track the provider's subscription identifier (e.g., Stripe sub_xxxxxx)
            $table->string('provider_subscription_id')->unique()->nullable();

            $table->string('payment_method', 50);
            $table->json('provider_metadata')->nullable();

            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            $table->softDeletes();

            $table->index(['user_id', 'status'], 'idx_subscriptions_user_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
