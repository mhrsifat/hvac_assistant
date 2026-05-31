<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {

        Schema::connection('pgsql_vector')->dropIfExists('manual_vectors');

        DB::connection('pgsql_vector')
            ->statement('CREATE EXTENSION IF NOT EXISTS vector');

        Schema::connection('pgsql_vector')->create('manual_vectors', function (Blueprint $table) {
            $table->id();
            $table->text('content');
            $table->vector('embedding', 1536)->index();
        });
    }

    public function down(): void
    {
        Schema::connection('pgsql_vector')->dropIfExists('manual_vectors');
    }
};
