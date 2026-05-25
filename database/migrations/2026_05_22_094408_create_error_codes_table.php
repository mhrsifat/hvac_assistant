<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'mysql';

    public function up(): void
    {
        Schema::create('error_codes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('brand_id')->nullable()->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('hvac_model_id')->nullable()->index();
            $table->string('code')->index();
            $table->text('description');
            $table->text('resolution_steps');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('error_codes');
    }
};
