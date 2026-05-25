<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Services\Web\BrandService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BrandController extends Controller
{
    public function __construct(private BrandService $brandService) {}

    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));

        return Inertia::render('brands/index', [
            'filters' => [
                'search' => $search,
            ],
            'brands' => Inertia::defer(fn () => $this->brandService->paginateForIndex(
                search: $search !== '' ? $search : null,
            )),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:brands,name'],
            'logo' => ['nullable', 'image', 'max:2048'],
        ]);

        $this->brandService->create(
            data: $validated,
            logo: $request->file('logo'),
        );

        return back()->with('success', 'Brand created successfully.');
    }

    public function update(Request $request, Brand $brand): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:brands,name,'.$brand->id],
            'logo' => ['nullable', 'image', 'max:2048'],
            'remove_logo' => ['nullable', 'boolean'],
        ]);

        $this->brandService->update(
            brand: $brand,
            data: $validated,
            logo: $request->file('logo'),
            removeLogo: (bool) ($validated['remove_logo'] ?? false),
        );

        return back()->with('success', 'Brand updated successfully.');
    }

    public function destroy(Brand $brand): RedirectResponse
    {
        $this->brandService->delete($brand);

        return back()->with('success', 'Brand deleted successfully.');
    }
}
