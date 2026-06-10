<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Jobs\EmbedErrorCodeJob;
use App\Jobs\FeedDocumentToAiJob;
use App\Models\ErrorCode;
use App\Models\HvacModel;
use App\Models\SupportDocument;
use App\Services\Web\HvacModelService;
use App\Services\Web\SupportDocumentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class HvacModelController extends Controller
{
    public function __construct(
        private HvacModelService $hvacModelService,
        private SupportDocumentService $supportDocumentService,
    ) {}

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

    public function show(HvacModel $hvacModel): Response
    {
        $hvacModel->load('brand:id,slug,name,logo_path');
        $hvacModel->loadCount(['documents', 'errorCodes']);

        return Inertia::render('hvac-models/show', [
            'model' => $hvacModel,
            'documents' => Inertia::defer(fn () => $hvacModel
                ->documents()
                ->latest('id')
                ->get()),
            'errorCodes' => Inertia::defer(fn () => $hvacModel
                ->errorCodes()
                ->latest('id')
                ->get()),
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

        return redirect()
            ->route('hvac-models.index')
            ->with('success', 'HVAC model deleted successfully.');
    }

    public function storeDocument(Request $request, HvacModel $hvacModel): RedirectResponse
    {
        $request->validate([
            'documents' => ['required', 'array', 'min:1'],
            'documents.*' => ['required', 'file', 'max:20480', 'mimes:pdf,docx,xlsx,csv,txt,jpg,jpeg,png,webp,gif'],
        ], [
            'documents.required' => 'Please upload at least one document.',
            'documents.*.required' => 'Please upload a document.',
            'documents.*.file' => 'The uploaded file must be a valid file.',
            'documents.*.max' => 'The document size must not exceed 20 MB.',
            'documents.*.mimes' => 'Unsupported file type. Allowed types: pdf, docx, xlsx, csv, txt, jpg, jpeg, png, webp, gif.',
        ]);

        try {
            $files = $request->file('documents');

            foreach ($files as $file) {
                $this->supportDocumentService->createForModel($hvacModel, $file);
            }

            return back()->with('success', 'Model documents uploaded successfully.');
        } catch (\Throwable $exception) {
            Log::error('Failed to upload model documents', [
                'model_id' => $hvacModel->id,
                'error_message' => $exception->getMessage(),
                'error_type' => $exception::class,
            ]);

            return back()->with('error', 'Failed to upload documents. Please try again.');
        }
    }

    public function destroyDocument(HvacModel $hvacModel, SupportDocument $document): RedirectResponse
    {
        if ($document->hvac_model_id !== $hvacModel->id) {
            abort(404);
        }

        $this->supportDocumentService->delete($document);

        return back()->with('success', 'Model document deleted successfully.');
    }

    public function feedDocument(HvacModel $hvacModel, SupportDocument $document): RedirectResponse
    {
        if ($document->hvac_model_id !== $hvacModel->id) {
            abort(404);
        }

        if ($document->ai_fed && empty($document->ai_feed_error)) {
            return back()->with('success', 'Document already fed to AI.');
        }

        if ($document->is_processing) {
            return back()->with('success', 'Document is already processing.');
        }

        $document->forceFill([
            'is_processing' => true,
        ])->save();

        FeedDocumentToAiJob::dispatch($document);

        return back()->with('success', 'Document is being fed to AI in the background. This may take a few moments.');
    }

    public function storeErrorCode(Request $request, HvacModel $hvacModel): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:100'],
            'description' => ['required', 'string'],
            'resolution_steps' => ['required', 'string'],
        ]);

        $errorCode = $hvacModel->errorCodes()->create([
            'brand_id' => $hvacModel->brand_id,
            'hvac_model_id' => $hvacModel->id,
            'code' => $validated['code'],
            'description' => $validated['description'],
            'resolution_steps' => $validated['resolution_steps'],
        ]);

        EmbedErrorCodeJob::dispatch($errorCode);

        return back()->with('success', 'Model error code added and sent to AI successfully.');
    }

    public function destroyErrorCode(HvacModel $hvacModel, ErrorCode $errorCode): RedirectResponse
    {
        if ($errorCode->hvac_model_id !== $hvacModel->id) {
            abort(404);
        }

        $errorCode->delete();

        return back()->with('success', 'Model error code deleted successfully.');
    }
}
