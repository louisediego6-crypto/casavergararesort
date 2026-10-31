<?php

use App\Http\Controllers\PageController;
use App\Http\Controllers\PublicUploadController;
use App\Http\Controllers\ReminderJobController;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Support\Facades\Route;
use App\Http\Middleware\CvrStartSession;

Route::redirect('/', '/pages/landing.html');
Route::redirect('/index.html', '/pages/landing.html');

// Receipts: admin session required (must be declared before the generic /uploads route).
Route::middleware([EncryptCookies::class, AddQueuedCookiesToResponse::class, CvrStartSession::class])
    ->get('/uploads/payments/{file}', [PublicUploadController::class, 'paymentProof'])
    ->where('file', 'proof_[A-Za-z0-9_-]+\.[A-Za-z0-9]+');

Route::get('/uploads/{path}', [PublicUploadController::class, 'show'])->where('path', '.+');

Route::get('/pages/{page}.html', [PageController::class, 'show'])->where('page', '[A-Za-z0-9-]+');
Route::get('/pages/admin/{page}.html', [PageController::class, 'admin'])->where('page', '[A-Za-z0-9-]+');

// Cron-by-URL reminder jobs (protected by ?key=...). The CLI equivalents are `php artisan reminders:checkin|checkout`.
Route::get('/scripts/send-checkin-reminders', [ReminderJobController::class, 'checkin']);
Route::get('/scripts/send-checkout-reminders', [ReminderJobController::class, 'checkout']);
