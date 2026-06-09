<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Chat;
use App\Services\Web\ChatManagementService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ChatManagementController extends Controller
{
    public function __construct(private ChatManagementService $chatManagementService) {}

    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $status = trim((string) $request->input('status', ''));
        $userId = trim((string) $request->input('user_id', ''));
        $hvacModelId = trim((string) $request->input('hvac_model_id', ''));
        $brandId = trim((string) $request->input('brand_id', ''));

        return Inertia::render('chats/index', [
            'filters' => [
                'search' => $search,
                'status' => $status,
                'user_id' => $userId,
                'hvac_model_id' => $hvacModelId,
                'brand_id' => $brandId,
            ],
            'users' => $this->chatManagementService->userOptions(),
            'hvacModels' => $this->chatManagementService->hvacModelOptions(),
            'brands' => $this->chatManagementService->brandOptions(),
            'chats' => Inertia::defer(fn () => $this->chatManagementService->paginateForIndex(
                search: $search !== '' ? $search : null,
                status: $status !== '' ? $status : null,
                userId: $userId !== '' ? $userId : null,
                hvacModelId: $hvacModelId !== '' ? $hvacModelId : null,
                brandId: $brandId !== '' ? $brandId : null,
            )),
        ]);
    }

    public function show(Chat $chat): Response
    {
        $chat->load([
            'user:id,first_name,last_name,email,username',
            'user.subscriptions' => function ($query) {
                $query->whereIn('status', ['active', 'trialing'])
                    ->with('plan:id,name')
                    ->latest()
                    ->limit(1);
            },
            'hvacModel:id,name,model_number,brand_id',
            'hvacModel.brand:id,name,logo_path',
        ]);
        $chat->loadCount('messages');

        return Inertia::render('chats/show', [
            'chat' => $chat,
            'messages' => Inertia::defer(fn () => $chat
                ->messages()
                ->with('sender:id,first_name,last_name,email')
                ->latest()
                ->get()),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'hvac_model_id' => ['nullable', 'integer', 'exists:hvac_models,id'],
            'title' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:active,closed,limitHit'],
        ]);

        $this->chatManagementService->create($validated);

        return back()->with('success', 'Chat created successfully.');
    }

    public function updateStatus(Request $request, Chat $chat): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:active,closed,limitHit'],
        ]);

        $this->chatManagementService->updateStatus(
            chat: $chat,
            status: $validated['status'],
        );

        return back()->with('success', 'Chat status updated successfully.');
    }

    public function destroy(Chat $chat): RedirectResponse
    {
        $this->chatManagementService->delete($chat);

        return redirect()
            ->route('chats.index')
            ->with('success', 'Chat deleted successfully.');
    }
}
