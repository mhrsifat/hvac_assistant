<?php

namespace Modules\Legal\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Modules\Legal\Models\StaticPage;

class LegalController extends Controller
{
    public function termsAndConditions(): JsonResponse
    {
        $page = StaticPage::forSlug('terms-and-conditions');

        return $this->success(200, 'Terms and conditions fetched successfully', [
            'title' => $page->title,
            'content' => $page->content['body'] ?? '',
        ]);
    }

    public function privacyPolicy(): JsonResponse
    {
        $page = StaticPage::forSlug('privacy-policy');

        return $this->success(200, 'Privacy policy fetched successfully', [
            'title' => $page->title,
            'content' => $page->content['body'] ?? '',
        ]);
    }
}
