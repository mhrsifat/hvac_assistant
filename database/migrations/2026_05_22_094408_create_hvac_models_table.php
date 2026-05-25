<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'mysql';

    public function up(): void
    {
        Schema::create('hvac_models', function (Blueprint $table) {
            $table->id();
            $table->foreignId('brand_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('model_number')->nullable();
            $table->integer('capacity_btu')->nullable();
            $table->string('efficiency_rating')->nullable();
            $table->string('power_spec')->nullable();
            $table->string('refrigerant_type')->nullable();
            $table->string('image_path')->nullable();
            $table->timestamps();
        });

        Schema::table('error_codes', function (Blueprint $table) {
            $table->foreign('hvac_model_id')->references('id')->on('hvac_models')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        if (Schema::hasTable('error_codes')) {
            Schema::table('error_codes', function (Blueprint $table) {
                $table->dropForeign(['hvac_model_id']);
            });
        }

        Schema::dropIfExists('hvac_models');
    }
};
