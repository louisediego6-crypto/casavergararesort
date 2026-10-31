<?php

/**
 * Voucher helpers shared by the admin/staff voucher manager, the guest voucher endpoints and the
 * reservation sync. Discounts are applied as a negative "discount" line on the quotation (see
 * recalculateQuotationTotals in public/js/booking-data.js), so totals, downpayment and balance all
 * follow automatically.
 */

function cvr_voucher_normalize_code(string $code): string
{
    return strtoupper(preg_replace('/[^A-Za-z0-9_-]/', '', trim($code)));
}

/** Public-safe representation of a voucher row. */
function cvr_voucher_payload(array $row, bool $includeAdminFields = false): array
{
    $logoPath = (string) ($row['logo_path'] ?? '');
    $out = [
        'id' => (int) $row['id'],
        'code' => $row['code'],
        'title' => $row['title'],
        'description' => $row['description'] ?? '',
        'discountType' => $row['discount_type'],
        'discountValue' => (float) $row['discount_value'],
        'maxDiscount' => $row['max_discount'] !== null ? (float) $row['max_discount'] : null,
        'minSpend' => (float) ($row['min_spend'] ?? 0),
        'appliesTo' => $row['applies_to'],
        'validFrom' => $row['valid_from'],
        'validUntil' => $row['valid_until'],
        'accentColor' => $row['accent_color'] ?: '#0c3b5d',
        'logoUrl' => $logoPath !== '' ? config('cvr.site_url') . '/' . $logoPath : null,
        'terms' => $row['terms'] ?? '',
    ];
    if ($includeAdminFields) {
        $out['logoPath'] = $logoPath !== '' ? $logoPath : null;
        $out['usageLimit'] = $row['usage_limit'] !== null ? (int) $row['usage_limit'] : null;
        $out['usedCount'] = (int) ($row['used_count'] ?? 0);
        $out['isActive'] = (bool) $row['is_active'];
        $out['isPublic'] = (bool) $row['is_public'];
        $out['createdAt'] = $row['created_at'] ?? null;
        $out['updatedAt'] = $row['updated_at'] ?? null;
    }
    return $out;
}

/** Discount (PHP) a voucher gives on a subtotal, never more than the subtotal itself. */
function cvr_voucher_discount(array $row, float $subtotal): float
{
    if ($subtotal <= 0) {
        return 0.0;
    }
    $value = (float) $row['discount_value'];
    if ($row['discount_type'] === 'percent') {
        $amount = $subtotal * min(100.0, $value) / 100;
        if ($row['max_discount'] !== null && (float) $row['max_discount'] > 0) {
            $amount = min($amount, (float) $row['max_discount']);
        }
    } else {
        $amount = $value;
    }
    return round(min($amount, $subtotal), 2);
}

/**
 * Checks whether a voucher can be used right now.
 *
 * @return array{0: bool, 1: string} [ok, message when not ok]
 */
function cvr_voucher_check(PDO $pdo, array $row, float $subtotal, string $bookingType, string $ignoreReservation = ''): array
{
    if (!(int) $row['is_active']) {
        return [false, 'This voucher is no longer active.'];
    }
    $today = date('Y-m-d');
    if (!empty($row['valid_from']) && $today < $row['valid_from']) {
        return [false, 'This voucher is not valid yet. It starts on ' . date('M j, Y', strtotime($row['valid_from'])) . '.'];
    }
    if (!empty($row['valid_until']) && $today > $row['valid_until']) {
        return [false, 'This voucher expired on ' . date('M j, Y', strtotime($row['valid_until'])) . '.'];
    }
    if ($row['applies_to'] !== 'all' && $row['applies_to'] !== $bookingType) {
        return [false, 'This voucher only applies to ' . ($row['applies_to'] === 'room' ? 'room' : 'event') . ' bookings.'];
    }
    if ($subtotal < (float) $row['min_spend']) {
        return [false, 'A minimum spend of ₱' . number_format((float) $row['min_spend'], 2) . ' is needed to use this voucher.'];
    }
    if ($row['usage_limit'] !== null) {
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM voucher_redemptions WHERE voucher_id = ? AND reservation_ref <> ?');
        $stmt->execute([(int) $row['id'], $ignoreReservation]);
        if ((int) $stmt->fetchColumn() >= (int) $row['usage_limit']) {
            return [false, 'This voucher has reached its usage limit.'];
        }
    }
    return [true, ''];
}

/**
 * Keeps voucher_redemptions in step with the voucher line on a synced reservation
 * (one redemption per reservation; removed again if the voucher is taken off or the booking is cancelled).
 */
function cvr_voucher_sync_redemption(PDO $pdo, string $reservationId, ?int $userId, array $reservation, bool $cancelled): void
{
    try {
        $code = '';
        $discount = 0.0;
        foreach (($reservation['quotation']['lines'] ?? []) as $line) {
            if (($line['type'] ?? '') === 'discount' && !empty($line['voucherCode']) && ($line['approved'] ?? true) !== false) {
                $code = cvr_voucher_normalize_code((string) $line['voucherCode']);
                $discount = abs((float) ($line['amount'] ?? 0));
                break;
            }
        }

        if ($code === '' || $cancelled) {
            $pdo->prepare('DELETE FROM voucher_redemptions WHERE reservation_ref = ?')->execute([$reservationId]);
            return;
        }

        $stmt = $pdo->prepare('SELECT id FROM vouchers WHERE code = ?');
        $stmt->execute([$code]);
        $voucherId = $stmt->fetchColumn();
        if (!$voucherId) {
            return;
        }

        $pdo->prepare(
            'INSERT INTO voucher_redemptions (voucher_id, reservation_ref, user_id, discount_amount)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE voucher_id = VALUES(voucher_id), discount_amount = VALUES(discount_amount)'
        )->execute([(int) $voucherId, $reservationId, $userId, $discount]);
    } catch (\Throwable $e) {
        error_log('voucher redemption sync failed: ' . $e->getMessage());
    }
}
