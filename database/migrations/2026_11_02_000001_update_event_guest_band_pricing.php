<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('event_packages')
            ->whereNotIn('slug', ['ayesha', 'anica', 'amarah', 'custom'])
            ->update([
                'included_pax' => 50,
                'max_pax' => 200,
                'extra_pax_rate' => 1500,
            ]);

        DB::table('event_packages')
            ->whereIn('slug', ['ayesha', 'anica', 'amarah', 'custom'])
            ->update(['max_pax' => 200]);

        foreach (DB::table('event_packages')->get(['slug', 'addons_json']) as $package) {
            $addOns = $package->addons_json
                ? json_decode((string) $package->addons_json, true, 512, JSON_THROW_ON_ERROR)
                : [];
            if (!is_array($addOns)) {
                throw new \UnexpectedValueException("Invalid add-on catalog for event package {$package->slug}.");
            }

            $hasBuffet = false;
            foreach ($addOns as &$addOn) {
                if (!is_array($addOn)) {
                    throw new \UnexpectedValueException("Invalid add-on entry for event package {$package->slug}.");
                }
                if (($addOn['id'] ?? '') === 'cx-catering-buffet') {
                    $addOn['perPax'] = true;
                }
                if (!empty($addOn['perPax']) && ($addOn['category'] ?? '') === 'catering') {
                    $hasBuffet = true;
                }
            }
            unset($addOn);

            if (!$hasBuffet) {
                $addOns[] = [
                    'id' => 'cvr-event-buffet-catering',
                    'label' => 'Buffet-style catering (per pax)',
                    'price' => 250,
                    'category' => 'catering',
                    'perPax' => true,
                ];
            }

            DB::table('event_packages')
                ->where('slug', $package->slug)
                ->update(['addons_json' => json_encode($addOns, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)]);
        }

        DB::statement(<<<'SQL'
UPDATE `event_packages`
SET `inclusions_json` = REPLACE(
    REPLACE(
        REPLACE(`inclusions_json`, 'Add ₱1,000 per person for 51–100 pax', 'Add ₱1,500 per additional 50-guest band above 50 (maximum 200 guests)'),
        'Add ₱1,000 per additional 50-guest band above 50', 'Add ₱1,500 per additional 50-guest band above 50'
    ),
    '+₱1,000/person above 50', '+₱1,500 per additional 50-guest band above 50'
)
WHERE `inclusions_json` IS NOT NULL;
SQL);

        DB::statement(<<<'SQL'
UPDATE `site_text`
SET `text_value` = REPLACE(`text_value`, '₱1,000 per additional 50 guests', '₱1,500 per additional 50 guests')
WHERE `text_value` LIKE '%₱1,000 per additional 50 guests%';
SQL);
    }

    public function down(): void
    {
        // Keep the updated catalog values on rollback to avoid overwriting later package edits.
    }
};
