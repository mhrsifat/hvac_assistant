<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\HvacModel;
use App\Services\Web\HvacModelService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HvacModelController extends Controller
{
    public function __construct(private HvacModelService $hvacModelService) {}

    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $brandId = $request->filled('brand_id')
            ? $request->integer('brand_id')
            : null;

        return Inertia::render('hvac-models/index', [
            'filters' => [
                'search' => $search,
                'brand_id' => $brandId,
            ],
            'brands' => $this->hvacModelService->brandOptions(),
            'models' => Inertia::defer(fn () => $this->hvacModelService->paginateForIndex(
                search: $search !== '' ? $search : null,
                brandId: $brandId,
            )),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'brand_id' => ['required', 'integer', 'exists:brands,id'],
            'name' => ['required', 'string', 'max:255'],
            'model_number' => ['nullable', 'string', 'max:255'],
            'capacity_btu' => ['nullable', 'integer', 'min:0'],
            'efficiency_rating' => ['nullable', 'string', 'max:255'],
            'power_spec' => ['nullable', 'string', 'max:255'],
            'refrigerant_type' => ['nullable', 'string', 'max:255'],
            'image' => ['nullable', 'image', 'max:4096'],
        ]);

        $this->hvacModelService->create(
            data: $validated,
            image: $request->file('image'),
        );

        return back()->with('success', 'HVAC model created successfully.');
    }

    public function update(Request $request, HvacModel $hvacModel): RedirectResponse
    {
        $validated = $request->validate([
            'brand_id' => ['required', 'integer', 'exists:brands,id'],
            'name' => ['required', 'string', 'max:255'],
            'model_number' => ['nullable', 'string', 'max:255'],
            'capacity_btu' => ['nullable', 'integer', 'min:0'],
            'efficiency_rating' => ['nullable', 'string', 'max:255'],
            'power_spec' => ['nullable', 'string', 'max:255'],
            'refrigerant_type' => ['nullable', 'string', 'max:255'],
            'image' => ['nullable', 'image', 'max:4096'],
            'remove_image' => ['nullable', 'boolean'],
        ]);

        $this->hvacModelService->update(
            hvacModel: $hvacModel,
            data: $validated,
            image: $request->file('image'),
            removeImage: (bool) ($validated['remove_image'] ?? false),
        );

        return back()->with('success', 'HVAC model updated successfully.');
    }

    public function destroy(HvacModel $hvacModel): RedirectResponse
    {
        $this->hvacModelService->delete($hvacModel);

        return back()->with('success', 'HVAC model deleted successfully.');
    }
}
