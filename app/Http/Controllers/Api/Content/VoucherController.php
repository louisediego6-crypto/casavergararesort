<?php

namespace App\Http\Controllers\Api\Content;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

/** Guest-facing voucher endpoints: list the public vouchers and check a code against a booking. */
class VoucherController extends Controller
{
    /** Vouchers flagged "show to guests" that are active and inside their validity window. */
    public function index(Request $request)
    {
        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $pdo = get_db_connection();
        $stmt = $pdo->prepare(
            'SELECT v.* FROM vouchers v
             WHERE v.is_active = 1 AND v.is_public = 1
               AND (v.valid_from IS NULL OR v.valid_from <= CURDATE())
               AND (v.valid_until IS NULL OR v.valid_until >= CURDATE())
               AND (v.usage_limit IS NULL OR v.usage_limit > (SELECT COUNT(*) FROM voucher_redemptions r WHERE r.voucher_id = v.id))
             ORDER BY v.created_at DESC, v.id DESC'
        );
        $stmt->execute();

        $vouchers = array_map(static fn (array $row) => cvr_voucher_payload($row), $stmt->fetchAll());

        json_response(true, 'OK', ['vouchers' => $vouchers]);
    }

    /** POST { code, subtotal, bookingType, reservationId } -> voucher + the discount it gives. */
    public function validateCode(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_login();

        $body = get_json_body();
        $code = cvr_voucher_normalize_code(input_str($body, 'code'));
        $subtotal = is_numeric($body['subtotal'] ?? null) ? (float) $body['subtotal'] : 0.0;
        $bookingType = input_str($body, 'bookingType') === 'event' ? 'event' : 'room';
        $reservationId = mb_substr(input_str($body, 'reservationId'), 0, 40);

        if ($code === '') {
            json_response(false, 'Enter a voucher code.', [], 422);
        }

        $pdo = get_db_connection();
        $stmt = $pdo->prepare('SELECT * FROM vouchers WHERE code = ?');
        $stmt->execute([$code]);
        $row = $stmt->fetch();

        if (!$row) {
            json_response(false, 'That voucher code was not found. Please check it and try again.', [], 404);
        }

        [$ok, $message] = cvr_voucher_check($pdo, $row, $subtotal, $bookingType, $reservationId);
        if (!$ok) {
            json_response(false, $message, [], 422);
        }

        $discount = cvr_voucher_discount($row, $subtotal);
        if ($discount <= 0) {
            json_response(false, 'This voucher gives no discount on this booking.', [], 422);
        }

        json_response(true, 'Voucher applied.', [
            'voucher' => cvr_voucher_payload($row),
            'discountAmount' => $discount,
        ]);
    }
}
