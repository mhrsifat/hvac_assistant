<?php

namespace Modules\Monetization\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Monetization\Models\Plan;
use Modules\Monetization\Models\Subscription;
use Modules\Monetization\Services\Web\SubscriptionService;

class SubscriptionController extends Controller
{
    public function __construct(
        private SubscriptionService $subscriptionService,
    ) {}

    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $status = $request->input('status', '');

        return Inertia::render('subscriptions/index', [
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
            'plans' => Plan::query()->active()->select('id', 'name', 'slug')->get(),
            'subscriptions' => Inertia::defer(fn () => $this->subscriptionService->paginateForIndex(
                search: $search !== '' ? $search : null,
                status: $status !== '' ? $status : null,
            )),
        ]);
    }

    public function show(Subscription $subscription): Response
    {
        $data = $this->subscriptionService->getShowPageData($subscription);

        return Inertia::render('subscriptions/show', [
            'subscription' => $data['subscription'],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'plan_id' => ['required', 'integer', 'exists:plans,id'],
            'payment_method' => ['required', 'string', 'max:50'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'status' => ['required', 'in:active,trialing,paused'],
        ]);

        $user = User::findOrFail($validated['user_id']);
        $plan = Plan::findOrFail($validated['plan_id']);

        $this->subscriptionService->createManual($user, $plan, $validated);

        return back()->with('success', 'Manual subscription created successfully.');
    }

    public function cancel(Subscription $subscription): RedirectResponse
    {
        $this->subscriptionService->cancel($subscription);

        return back()->with('success', 'Subscription has been cancelled.');
    }

    public function extend(Request $request, Subscription $subscription): RedirectResponse
    {
        $request->validate([
            'days' => ['required', 'integer', 'min:1', 'max:365'],
        ]);

        $this->subscriptionService->extend($subscription, (int) $request->input('days'));

        return back()->with('success', "Subscription extended by {$request->input('days')} days.");
    }

    public function pause(Subscription $subscription): RedirectResponse
    {
        $this->subscriptionService->pause($subscription);

        return back()->with('success', 'Subscription has been paused.');
    }

    public function reactivate(Subscription $subscription): RedirectResponse
    {
        $this->subscriptionService->reactivate($subscription);

        return back()->with('success', 'Subscription has been reactivated.');
    }

    public function reduceDays(Request $request, Subscription $subscription): RedirectResponse
    {
        $request->validate([
            'days' => ['required', 'integer', 'min:1', 'max:365'],
        ]);

        $this->subscriptionService->reduceDays($subscription, (int) $request->input('days'));

        return back()->with('success', "Subscription reduced by {$request->input('days')} days.");
    }
}
