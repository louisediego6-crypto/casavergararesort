<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use finfo;

/** Voucher manager API. Admin and staff (event manager) accounts can both create, edit and delete vouchers. */
class VoucherController extends Controller
{
    public function index(Request $request)
    {
        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin', 'event_manager']);

        $pdo = get_db_connection();
        $rows = $pdo->query(
            'SELECT v.*, (SELECT COUNT(*) FROM voucher_redemptions r WHERE r.voucher_id = v.id) AS used_count
             FROM vouchers v ORDER BY v.is_active DESC, v.created_at DESC, v.id DESC'
        )->fetchAll();

        $vouchers = array_map(static fn (array $row) => cvr_voucher_payload($row, true), $rows);

        json_response(true, 'OK', ['vouchers' => $vouchers]);
    }

    public function save(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $session = require_role(['admin', 'event_manager']);

        $body = get_json_body();
        $id = (int) ($body['id'] ?? 0);
        $code = cvr_voucher_normalize_code(input_str($body, 'code'));
        $title = input_str($body, 'title');
        $description = input_str($body, 'description');
        $type = input_str($body, 'discountType', 'percent');
        $value = is_numeric($body['discountValue'] ?? null) ? round((float) $body['discountValue'], 2) : 0.0;
        $maxDiscount = isset($body['maxDiscount']) && $body['maxDiscount'] !== '' && is_numeric($body['maxDiscount'])
            ? round((float) $body['maxDiscount'], 2) : null;
        $minSpend = isset($body['minSpend']) && is_numeric($body['minSpend']) ? round((float) $body['minSpend'], 2) : 0.0;
        $appliesTo = input_str($body, 'appliesTo', 'all');
        $validFrom = input_str($body, 'validFrom');
        $validUntil = input_str($body, 'validUntil');
        $usageLimit = isset($body['usageLimit']) && $body['usageLimit'] !== '' && is_numeric($body['usageLimit'])
            ? max(1, (int) $body['usageLimit']) : null;
        $accent = input_str($body, 'accentColor', '#0c3b5d');
        $logoPath = input_str($body, 'logoPath');
        $terms = input_str($body, 'terms');
        $isActive = !empty($body['isActive']) ? 1 : 0;
        $isPublic = !empty($body['isPublic']) ? 1 : 0;

        if ($code === '' || mb_strlen($code) < 3 || mb_strlen($code) > 40) {
            json_response(false, 'Voucher code must be 3–40 letters, numbers, dashes or underscores.', [], 422);
        }
        if ($title === '' || mb_strlen($title) > 120) {
            json_response(false, 'Give the voucher a title (120 characters or fewer).', [], 422);
        }
        if (mb_strlen($description) > 255) {
            json_response(false, 'Description must be 255 characters or fewer.', [], 422);
        }
        if (!in_array($type, ['percent', 'fixed'], true)) {
            json_response(false, 'Choose a percentage or fixed-amount discount.', [], 422);
        }
        if ($value <= 0) {
            json_response(false, 'The discount must be greater than zero.', [], 422);
        }
        if ($type === 'percent' && $value > 100) {
            json_response(false, 'A percentage discount cannot be more than 100%.', [], 422);
        }
        if (!in_array($appliesTo, ['all', 'room', 'event'], true)) {
            $appliesTo = 'all';
        }
        $dateOk = static fn (string $d) => $d === '' || (bool) preg_match('/^\d{4}-\d{2}-\d{2}$/', $d);
        if (!$dateOk($validFrom) || !$dateOk($validUntil)) {
            json_response(false, 'Use valid dates for the validity period.', [], 422);
        }
        if ($validFrom !== '' && $validUntil !== '' && $validUntil < $validFrom) {
            json_response(false, 'The end date must be on or after the start date.', [], 422);
        }
        if (!preg_match('/^#[0-9a-fA-F]{6}$/', $accent)) {
            $accent = '#0c3b5d';
        }
        if ($logoPath !== '' && !preg_match('#^uploads/vouchers/[A-Za-z0-9_.-]+$#', $logoPath)) {
            $logoPath = '';
        }
        if (mb_strlen($terms) > 2000) {
            json_response(false, 'Terms must be 2000 characters or fewer.', [], 422);
        }

        $pdo = get_db_connection();

        $dup = $pdo->prepare('SELECT id FROM vouchers WHERE code = ? AND id <> ?');
        $dup->execute([$code, $id]);
        if ($dup->fetch()) {
            json_response(false, 'Another voucher already uses the code ' . $code . '.', [], 422);
        }

        $params = [
            $code, $title, $description, $type, $value, $maxDiscount, $minSpend, $appliesTo,
            $validFrom !== '' ? $validFrom : null, $validUntil !== '' ? $validUntil : null,
            $usageLimit, $accent, $logoPath !== '' ? $logoPath : null, $terms !== '' ? $terms : null,
            $isActive, $isPublic,
        ];

        if ($id > 0) {
            $exists = $pdo->prepare('SELECT id FROM vouchers WHERE id = ?');
            $exists->execute([$id]);
            if (!$exists->fetch()) {
                json_response(false, 'That voucher could not be found.', [], 404);
            }
            $pdo->prepare(
                'UPDATE vouchers SET code = ?, title = ?, description = ?, discount_type = ?, discount_value = ?,
                    max_discount = ?, min_spend = ?, applies_to = ?, valid_from = ?, valid_until = ?, usage_limit = ?,
                    accent_color = ?, logo_path = ?, terms = ?, is_active = ?, is_public = ? WHERE id = ?'
            )->execute(array_merge($params, [$id]));
            json_response(true, 'Voucher updated.', ['id' => $id]);
        }

        $pdo->prepare(
            'INSERT INTO vouchers (code, title, description, discount_type, discount_value, max_discount, min_spend,
                applies_to, valid_from, valid_until, usage_limit, accent_color, logo_path, terms, is_active, is_public, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )->execute(array_merge($params, [(int) ($session['user_id'] ?? 0) ?: null]));

        json_response(true, 'Voucher created.', ['id' => (int) $pdo->lastInsertId()]);
    }

    public function delete(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin', 'event_manager']);

        $body = get_json_body();
        $id = (int) ($body['id'] ?? 0);
        if ($id <= 0) {
            json_response(false, 'A valid voucher is required.', [], 422);
        }

        $pdo = get_db_connection();
        $stmt = $pdo->prepare('DELETE FROM vouchers WHERE id = ?');
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) {
            json_response(false, 'That voucher could not be found.', [], 404);
        }
        // Reservations that already used it keep their discount; only the usage record is dropped.
        $pdo->prepare('DELETE FROM voucher_redemptions WHERE voucher_id = ?')->execute([$id]);

        json_response(true, 'Voucher deleted.');
    }

    /** Optional custom logo for one voucher. Without it the voucher card shows the resort logo. */
    public function logo(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin', 'event_manager']);

        if (empty($_FILES['logo']) || !is_array($_FILES['logo'])) {
            json_response(false, 'No logo was uploaded.', [], 422);
        }

        $file = $_FILES['logo'];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            json_response(false, 'The logo failed to upload. Please try again.', [], 422);
        }
        if ($file['size'] > 2 * 1024 * 1024) {
            json_response(false, 'Logo must be smaller than 2 MB.', [], 422);
        }

        $allowedMime = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
        $detectedMime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']) ?: '';
        if (!isset($allowedMime[$detectedMime])) {
            json_response(false, 'Logo must be a JPG, PNG, or WEBP image.', [], 422);
        }
        if (@getimagesize($file['tmp_name']) === false) {
            json_response(false, 'That file does not look like a valid image.', [], 422);
        }

        $fileName = 'voucher_' . bin2hex(random_bytes(8)) . '.' . $allowedMime[$detectedMime];
        $dir = cvr_path('uploads/vouchers');
        if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
            json_response(false, 'Could not create the upload folder.', [], 500);
        }
        if (!move_uploaded_file($file['tmp_name'], $dir . '/' . $fileName)) {
            json_response(false, 'Could not save the uploaded logo. Please try again.', [], 500);
        }

        $relative = 'uploads/vouchers/' . $fileName;
        json_response(true, 'Logo uploaded.', [
            'logoPath' => $relative,
            'logoUrl' => config('cvr.site_url') . '/' . $relative,
        ]);
    }
}
