<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PublicUploadTest extends TestCase
{
    public function test_upload_paths_use_the_railway_volume_mount(): void
    {
        $this->assertSame(
            storage_path('app/public/uploads/avatars/avatar.jpg'),
            cvr_path('uploads/avatars/avatar.jpg')
        );
        $this->assertSame(
            storage_path('app/public/uploads/chat/message.png'),
            cvr_path('uploads/chat/message.png')
        );
    }

    public function test_persistent_public_uploads_are_served_inline(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put(
            'uploads/site/test-image.png',
            file_get_contents(public_path('images/logo-email.png'))
        );

        $this->get('/uploads/site/test-image.png')
            ->assertOk()
            ->assertHeader('Content-Type', 'image/png')
            ->assertHeader('X-Content-Type-Options', 'nosniff');
    }

    public function test_private_upload_directories_are_not_served(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put(
            'uploads/payments/proof_test.png',
            file_get_contents(public_path('images/logo-email.png'))
        );

        $this->get('/uploads/payments/proof_test.png')->assertNotFound();
        $this->get('/uploads/chat/test-image.png')->assertNotFound();
    }
}
