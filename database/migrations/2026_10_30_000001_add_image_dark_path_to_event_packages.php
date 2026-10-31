<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

/** Optional dark-mode photo for event packages (shown instead of the main photo when the site is in dark mode). */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('event_packages') && !Schema::hasColumn('event_packages', 'image_dark_path')) {
            Schema::table('event_packages', function (Blueprint $table) {
                $table->string('image_dark_path', 255)->nullable()->after('image_path');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('event_packages', 'image_dark_path')) {
            Schema::table('event_packages', function (Blueprint $table) {
                $table->dropColumn('image_dark_path');
            });
        }
    }
};
