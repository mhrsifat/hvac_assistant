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

        return Inertia::render('chats/index', [
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
            'users' => $this->chatManagementService->userOptions(),
            'hvacModels' => $this->chatManagementService->hvacModelOptions(),
            'chats' => Inertia::defer(fn () => $this->chatManagementService->paginateForIndex(
                search: $search !== '' ? $search : null,
                status: $status !== '' ? $status : null,
            )),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'hvac_model_id' => ['nullable', 'integer', 'exists:hvac_models,id'],
            'title' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:active,closed'],
        ]);

        $this->chatManagementService->create($validated);

        return back()->with('success', 'Chat created successfully.');
    }

    public function updateStatus(Request $request, Chat $chat): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:active,closed'],
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

        return back()->with('success', 'Chat deleted successfully.');
    }
}
