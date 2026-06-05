<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Web\UserService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Monetization\Models\Plan;

class UserController extends Controller
{
    public function __construct(
        private UserService $userService,
    ) {}

    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $status = $request->input('status', '');

        return Inertia::render('users/index', [
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
            'users' => Inertia::defer(fn () => $this->userService->paginateForIndex(
                search: $search !== '' ? $search : null,
                status: $status !== '' ? $status : null,
            )),
        ]);
    }

    public function show(User $user): Response
    {
        $data = $this->userService->getShowPageData($user);

        return Inertia::render('users/show', [
            'user' => $data['user'],
            'subscriptions' => $data['subscriptions'],
            'payments' => $data['payments'],
            'plans' => Plan::query()->active()->select('id', 'name', 'slug')->get(),
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'first_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'password' => ['nullable', 'string', 'min:8'],
            'status' => ['nullable', 'in:active,inactive'],
            'is_verified' => ['nullable', 'in:0,1'],
            'avatar' => ['nullable', 'image', 'max:2048'],
            'remove_avatar' => ['nullable', 'boolean'],
        ]);

        $this->userService->update($user, $validated);

        return back()->with('success', 'User updated successfully.');
    }

    public function softDelete(User $user): RedirectResponse
    {
        $this->userService->softDelete($user);

        return redirect()->route('users.index')->with('success', 'User has been deactivated.');
    }

    public function forceDelete(User $user): RedirectResponse
    {
        $this->userService->forceDelete($user);

        return redirect()->route('users.index')->with('success', 'User has been permanently deleted.');
    }
}
