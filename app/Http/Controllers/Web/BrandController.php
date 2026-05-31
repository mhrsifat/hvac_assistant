<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBrandDocumentRequest;
use App\Models\Brand;
use App\Models\ErrorCode;
use App\Models\SupportDocument;
use App\Services\Web\BrandService;
use App\Services\Web\SupportDocumentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Reverb\Loggers\Log;
use Throwable;

class BrandController extends Controller
{
    public function __construct(
        private BrandService $brandService,
        private SupportDocumentService $supportDocumentService,
    ) {}

    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));

        return Inertia::render('brands/index', [
            'filters' => [
                'search' => $search,
            ],
            'brands' => Inertia::defer(fn() => $this->brandService->paginateForIndex(
                search: $search !== '' ? $search : null,
            )),
        ]);
    }

    public function show(Brand $brand): Response
    {
        $brand->loadCount([
            'hvacModels',
            'documents as documents_count' => fn($query) => $query->whereNull('hvac_model_id'),
            'errorCodes as error_codes_count' => fn($query) => $query->whereNull('hvac_model_id'),
        ]);

        return Inertia::render('brands/show', [
            'brand' => $brand,
            'documents' => Inertia::defer(fn() => $brand
                ->documents()
                ->whereNull('hvac_model_id')
                ->latest('id')
                ->get()),
            'errorCodes' => Inertia::defer(fn() => $brand
                ->errorCodes()
                ->whereNull('hvac_model_id')
                ->latest('id')
                ->paginate(10, ['*'], 'error_codes_page')
                ->withQueryString()),
            'models' => Inertia::defer(fn() => $brand
                ->hvacModels()
                ->withCount(['documents', 'errorCodes'])
                ->latest('id')
                ->paginate(10, ['*'], 'models_page')
                ->withQueryString()),
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
            'name' => ['required', 'string', 'max:255', 'unique:brands,name,' . $brand->id],
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

        return redirect()
            ->route('brands.index')
            ->with('success', 'Brand deleted successfully.');
    }

    public function storeDocument(StoreBrandDocumentRequest $request, Brand $brand): RedirectResponse
    {
        try {
            $files = $request->file('documents');

            foreach ($files as $file) {
                $this->supportDocumentService->createForBrand($brand, $file);
            }

            return back()->with('success', 'Brand documents uploaded successfully.');
        } catch (Throwable $exception) {
            Log::error('Failed to upload brand documents', [
                'brand_id' => $brand->id,
                'error_message' => $exception->getMessage(),
                'error_type' => $exception::class,
            ]);

            return back()->with('error', 'Failed to upload documents. Please try again.');
        }
    }

    public function destroyDocument(Brand $brand, SupportDocument $document): RedirectResponse
    {
        if ($document->brand_id !== $brand->id || $document->hvac_model_id !== null) {
            abort(404);
        }

        $this->supportDocumentService->delete($document);

        return back()->with('success', 'Brand document deleted successfully.');
    }

    public function feedDocument(Brand $brand, SupportDocument $document): RedirectResponse
    {
        if ($document->brand_id !== $brand->id || $document->hvac_model_id !== null) {
            abort(404);
        }

        if ($document->ai_fed && empty($document->ai_feed_error)) {
            return back()->with('success', 'Document already fed to AI.');
        }

        try {
            $this->supportDocumentService->feedBrandDocumentToAi($brand, $document);
            $document->forceFill([
                'ai_fed' => true,
                'ai_feed_error' => null,
            ])->save();

            return back()->with('success', 'Document fed to AI successfully.');
        } catch (Throwable $exception) {
            $document->forceFill([
                'ai_fed' => false,
                'ai_feed_error' => [
                    'message' => $exception->getMessage(),
                    'type' => $exception::class,
                ],
            ])->save();

            return back()->with('error', 'AI feed failed. Please try again.');
        }
    }

    public function storeErrorCode(Request $request, Brand $brand): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:100'],
            'description' => ['required', 'string'],
            'resolution_steps' => ['required', 'string'],
        ]);

        $brand->errorCodes()->create([
            'brand_id' => $brand->id,
            'hvac_model_id' => null,
            'code' => $validated['code'],
            'description' => $validated['description'],
            'resolution_steps' => $validated['resolution_steps'],
        ]);

        return back()->with('success', 'Brand error code added successfully.');
    }

    public function destroyErrorCode(Brand $brand, ErrorCode $errorCode): RedirectResponse
    {
        if ($errorCode->brand_id !== $brand->id || $errorCode->hvac_model_id !== null) {
            abort(404);
        }

        $errorCode->delete();

        return back()->with('success', 'Brand error code deleted successfully.');
    }
}
