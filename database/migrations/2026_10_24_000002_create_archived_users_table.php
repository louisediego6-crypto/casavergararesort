<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * `archived_users` - accounts removed from the admin User Management page.
 * Each row keeps a full JSON snapshot of the user so the account can be restored later.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement(<<<'SQL'
CREATE TABLE IF NOT EXISTS `archived_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `original_user_id` int(11) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(191) NOT NULL,
  `phone` varchar(30) NOT NULL DEFAULT '',
  `role` enum('customer','admin','event_manager') NOT NULL DEFAULT 'customer',
  `snapshot` longtext NOT NULL,
  `archived_by` int(11) DEFAULT NULL,
  `archived_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_archived_users_original` (`original_user_id`),
  KEY `idx_archived_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SQL);
    }

    public function down(): void
    {
        Schema::dropIfExists('archived_users');
    }
};
