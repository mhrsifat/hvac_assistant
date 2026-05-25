<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! $this->isVectorConnectionAvailable()) {
            return;
        }

        DB::connection('pgsql_vector')->statement('CREATE EXTENSION IF NOT EXISTS vector');

        DB::connection('pgsql_vector')->statement(
            'CREATE TABLE manual_vectors (
                id BIGSERIAL PRIMARY KEY,
                content TEXT NOT NULL,
                embedding vector(1536)
            )'
        );
    }

    public function down(): void
    {
        if (! $this->isVectorConnectionAvailable()) {
            return;
        }

        Schema::connection('pgsql_vector')->dropIfExists('manual_vectors');
        DB::connection('pgsql_vector')->statement('DROP EXTENSION IF EXISTS vector');
    }

    private function isVectorConnectionAvailable(): bool
    {
        try {
            DB::connection('pgsql_vector')->getPdo();

            return true;
        } catch (QueryException|Throwable) {
            return false;
        }
    }
};
