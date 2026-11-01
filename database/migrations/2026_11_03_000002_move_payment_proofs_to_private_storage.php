<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $sources = [
            public_path('uploads/payments'),
            storage_path('app/public/uploads/payments'),
        ];
        $destination = storage_path('app/private/uploads/payments');

        if (!is_dir($destination) && !mkdir($destination, 0700, true) && !is_dir($destination)) {
            throw new RuntimeException('Could not create private payment receipt storage.');
        }
        if (!chmod($destination, 0700)) {
            throw new RuntimeException('Could not restrict permissions on private payment receipt storage.');
        }

        foreach (array_unique($sources) as $source) {
            if (!is_dir($source)) {
                continue;
            }

            $entries = scandir($source);
            if ($entries === false) {
                throw new RuntimeException("Could not read payment receipt directory: {$source}");
            }

            foreach ($entries as $entry) {
                if (!preg_match('/\Aproof_[A-Za-z0-9_-]+\.[A-Za-z0-9]+\z/', $entry)) {
                    continue;
                }

                $sourceFile = $source . DIRECTORY_SEPARATOR . $entry;
                if (is_link($sourceFile) || !is_file($sourceFile)) {
                    continue;
                }

                $destinationFile = $destination . DIRECTORY_SEPARATOR . $entry;
                if (is_file($destinationFile)) {
                    $sourceHash = hash_file('sha256', $sourceFile);
                    $destinationHash = hash_file('sha256', $destinationFile);
                    if ($sourceHash === false || $destinationHash === false || $sourceHash !== $destinationHash) {
                        throw new RuntimeException("Conflicting payment receipt files found for {$entry}.");
                    }
                    if (!unlink($sourceFile)) {
                        throw new RuntimeException("Could not remove the public payment receipt {$entry}.");
                    }
                    if (!chmod($destinationFile, 0600)) {
                        throw new RuntimeException("Could not restrict permissions for payment receipt {$entry}.");
                    }
                    continue;
                }

                if (!copy($sourceFile, $destinationFile)) {
                    throw new RuntimeException("Could not move payment receipt {$entry} to private storage.");
                }
                if (filesize($sourceFile) !== filesize($destinationFile)) {
                    throw new RuntimeException("Payment receipt copy verification failed for {$entry}.");
                }
                if (!chmod($destinationFile, 0600)) {
                    throw new RuntimeException("Could not restrict permissions for payment receipt {$entry}.");
                }
                if (!unlink($sourceFile)) {
                    throw new RuntimeException("Could not remove the public payment receipt {$entry}.");
                }
            }
        }
    }

    public function down(): void
    {
        // Receipts remain private if the migration is rolled back.
    }
};
