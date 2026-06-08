<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'mysql';

    public function up(): void
    {
        Schema::create('chats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('hvac_model_id')->nullable()->constrained()->nullOnDelete();
            $table->string('slug')->unique();
            $table->string('title');
            $table->unsignedInteger('tokens')->default(0);
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::table('chat_messages', function (Blueprint $table) {
            $table->foreign('chat_id')->references('id')->on('chats')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        if (Schema::hasTable('chat_messages')) {
            Schema::table('chat_messages', function (Blueprint $table) {
                $table->dropForeign(['chat_id']);
            });
        }

        Schema::dropIfExists('chats');
    }
};
