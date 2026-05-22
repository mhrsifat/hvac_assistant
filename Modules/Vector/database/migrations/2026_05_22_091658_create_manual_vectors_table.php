<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // Ensure pgvector extension is enabled on the PostgreSQL database
        DB::connection('pgsql_vector')->statement('CREATE EXTENSION IF NOT EXISTS vector');

        Schema::connection('pgsql_vector')->create('manual_vectors', function (Blueprint $table) {
            $table->id();
            $table->text('content');
        });

        // Add the vector column for text-embedding-ada-002 (1536 dimensions)
        DB::connection('pgsql_vector')->statement('ALTER TABLE manual_vectors ADD COLUMN embedding vector(1536)');
    }

    public function down()
    {
        Schema::connection('pgsql_vector')->dropIfExists('manual_vectors');
        DB::connection('pgsql_vector')->statement('DROP EXTENSION IF EXISTS vector');
    }
};
