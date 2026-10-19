<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Storage;

class PublicUploadController extends Controller
{
    public function show(string $path)
    {
        $path = str_replace('\\', '/', $path);
        $segments = explode('/', $path);

        if (count($segments) !== 2) {
            return response('Not found.', 404);
        }

        [$directory, $filename] = $segments;
        if (!preg_match('/\A[a-zA-Z0-9][a-zA-Z0-9._-]*\z/', $filename)) {
            return response('Not found.', 404);
        }

        $isPublicDirectory = in_array($directory, ['avatars', 'packages', 'site', 'site-content', 'team'], true);
        $isPaymentQr = $directory === 'payments'
            && preg_match('/\Aqr_[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp)\z/i', $filename);

        if (!$isPublicDirectory && !$isPaymentQr) {
            return response('Not found.', 404);
        }

        $uploadsRoot = realpath(Storage::disk('public')->path('uploads'));
        $filePath = realpath(Storage::disk('public')->path('uploads/' . $directory . '/' . $filename));

        if (!$uploadsRoot || !$filePath || !str_starts_with($filePath, $uploadsRoot . DIRECTORY_SEPARATOR) || !is_file($filePath)) {
            return response('Not found.', 404);
        }

        $mimeType = (new \finfo(FILEINFO_MIME_TYPE))->file($filePath) ?: 'application/octet-stream';
        $isInlineImage = in_array($mimeType, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], true);

        return response()->file($filePath, [
            'Content-Type' => $isInlineImage ? $mimeType : 'application/octet-stream',
            'Content-Disposition' => ($isInlineImage ? 'inline' : 'attachment') . '; filename="' . $filename . '"',
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }
}
