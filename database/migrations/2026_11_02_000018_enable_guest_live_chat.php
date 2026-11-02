<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('live_chat_conversations', function ($table) {
            $table->dropForeign('live_chat_conversations_ibfk_1');
        });
        DB::statement('ALTER TABLE live_chat_conversations MODIFY customer_id INT NULL');
        Schema::table('live_chat_conversations', function ($table) {
            $table->char('guest_token_hash', 64)->nullable()->unique('uniq_chat_guest_token');
            $table->string('guest_name', 191)->nullable();
            $table->dateTime('guest_last_seen_at')->nullable();
        });

        Schema::table('live_chat_messages', function ($table) {
            $table->dropForeign('live_chat_messages_ibfk_2');
        });
        DB::statement('ALTER TABLE live_chat_messages MODIFY sender_id INT NULL');
    }

    public function down(): void
    {
        DB::table('live_chat_messages')->whereNull('sender_id')->delete();
        DB::table('live_chat_conversations')->whereNull('customer_id')->delete();
        Schema::table('live_chat_messages', function ($table) {
            $table->foreign('sender_id', 'live_chat_messages_ibfk_2')
                ->references('id')
                ->on('users')
                ->cascadeOnDelete();
        });
        DB::statement('ALTER TABLE live_chat_messages MODIFY sender_id INT NOT NULL');

        Schema::table('live_chat_conversations', function ($table) {
            $table->dropUnique('uniq_chat_guest_token');
            $table->dropColumn(['guest_token_hash', 'guest_name', 'guest_last_seen_at']);
        });
        DB::statement('ALTER TABLE live_chat_conversations MODIFY customer_id INT NOT NULL');
        Schema::table('live_chat_conversations', function ($table) {
            $table->foreign('customer_id', 'live_chat_conversations_ibfk_1')
                ->references('id')
                ->on('users')
                ->cascadeOnDelete();
        });
    }
};
