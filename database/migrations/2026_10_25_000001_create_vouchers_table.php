<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Vouchers / discounts. Admin and staff (event manager) accounts can create and edit them from
 * Admin > Vouchers. `logo_path` is optional: when empty the voucher card shows the resort logo.
 * `voucher_redemptions` records which reservation used which voucher (one voucher per reservation).
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement(<<<'SQL'
CREATE TABLE IF NOT EXISTS `vouchers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(40) NOT NULL,
  `title` varchar(120) NOT NULL,
  `description` varchar(255) NOT NULL DEFAULT '',
  `discount_type` enum('percent','fixed') NOT NULL DEFAULT 'percent',
  `discount_value` decimal(10,2) NOT NULL DEFAULT 0.00,
  `max_discount` decimal(10,2) DEFAULT NULL,
  `min_spend` decimal(10,2) NOT NULL DEFAULT 0.00,
  `applies_to` enum('all','room','event') NOT NULL DEFAULT 'all',
  `valid_from` date DEFAULT NULL,
  `valid_until` date DEFAULT NULL,
  `usage_limit` int(11) DEFAULT NULL,
  `accent_color` varchar(9) NOT NULL DEFAULT '#0c3b5d',
  `logo_path` varchar(255) DEFAULT NULL,
  `terms` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_public` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_voucher_code` (`code`),
  KEY `idx_voucher_active` (`is_active`,`is_public`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SQL);

        DB::statement(<<<'SQL'
CREATE TABLE IF NOT EXISTS `voucher_redemptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `voucher_id` int(11) NOT NULL,
  `reservation_ref` varchar(40) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `discount_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_redemption_reservation` (`reservation_ref`),
  KEY `idx_redemption_voucher` (`voucher_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SQL);

        // One sample voucher so the feature is visible right after migrating. Edit or delete it in Admin > Vouchers.
        DB::table('vouchers')->insertOrIgnore([
            'code' => 'WELCOME10',
            'title' => 'Welcome Voucher',
            'description' => '10% off your first stay or event at Casa Vergara Resort.',
            'discount_type' => 'percent',
            'discount_value' => 10,
            'max_discount' => 2000,
            'min_spend' => 0,
            'applies_to' => 'all',
            'accent_color' => '#0c3b5d',
            'terms' => 'One voucher per reservation. Cannot be combined with other vouchers. Not exchangeable for cash.',
            'is_active' => 1,
            'is_public' => 1,
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('voucher_redemptions');
        Schema::dropIfExists('vouchers');
    }
};
