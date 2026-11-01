<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $images = [
            'ayesha' => ['ayesha-light.svg', 'ayesha-dark.svg'],
            'anica' => ['anica-light.svg', 'anica-dark.svg'],
            'amarah' => ['amarah-light.svg', 'amarah-dark.svg'],
            'custom' => ['custom-light.svg', 'custom-dark.svg'],
            'private-morning' => ['private-morning-light.svg', 'private-morning-dark.svg'],
            'private-night' => ['private-night-light.svg', 'private-night-dark.svg'],
            'private-whole-day' => ['private-whole-day-light.svg', 'private-whole-day-dark.svg'],
            'others' => ['others-light.svg', 'others-dark.svg'],
        ];

        foreach ($images as $slug => [$light, $dark]) {
            DB::table('event_packages')
                ->where('slug', $slug)
                ->update([
                    'image_path' => "images/package-art/{$light}",
                    'image_dark_path' => "images/package-art/{$dark}",
                ]);
        }
    }

    public function down(): void
    {
        // Keep package artwork in place on rollback to avoid overwriting later package edits.
    }
};
