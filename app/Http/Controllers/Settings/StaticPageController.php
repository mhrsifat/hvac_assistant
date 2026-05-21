<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\StaticPageUpdateRequest;
use App\Models\StaticPage;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class StaticPageController extends Controller
{
    public function edit(string $slug): Response
    {
        $page = StaticPage::forSlug($slug);

        return Inertia::render($this->componentForSlug($slug), [
            'page' => $page,
        ]);
    }

    public function update(StaticPageUpdateRequest $request, string $slug): RedirectResponse
    {
        $page = StaticPage::forSlug($slug);
        $validated = $request->validated();

        $page->fill([
            'type' => $this->typeForSlug($slug),
            'title' => $validated['title'],
            'slug' => $slug,
            'status' => $validated['status'] ?? 'published',
            'content' => [
                'body' => $validated['content'],
            ],
        ])->save();

        return back()->with('success', $this->successMessageForSlug($slug));
    }

    private function componentForSlug(string $slug): string
    {
        return match ($slug) {
            'privacy-policy' => 'settings/privacy-policy',
            'terms-and-conditions' => 'settings/terms-and-conditions',
            default => abort(404),
        };
    }

    private function typeForSlug(string $slug): string
    {
        return match ($slug) {
            'privacy-policy' => 'privacy_policy',
            'terms-and-conditions' => 'terms_and_conditions',
            default => 'static_page',
        };
    }

    private function successMessageForSlug(string $slug): string
    {
        return match ($slug) {
            'privacy-policy' => 'Privacy policy updated successfully.',
            'terms-and-conditions' => 'Terms and conditions updated successfully.',
            default => 'Static page updated successfully.',
        };
    }
}
