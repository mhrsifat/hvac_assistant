<?php

namespace Modules\Monetization\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Monetization\Models\Payment;
use Modules\Monetization\Models\Plan;
use Modules\Monetization\Services\Web\TransactionService;

class TransactionController extends Controller
{
    public function __construct(
        private TransactionService $transactionService,
    ) {}

    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $status = $request->input('status', '');

        return Inertia::render('transactions/index', [
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
            'plans' => Plan::query()->active()->select('id', 'name', 'slug')->get(),
            'transactions' => Inertia::defer(fn () => $this->transactionService->paginateForIndex(
                search: $search !== '' ? $search : null,
                status: $status !== '' ? $status : null,
            )),
        ]);
    }

    public function show(Payment $transaction): Response
    {
        $data = $this->transactionService->getShowPageData($transaction);

        return Inertia::render('transactions/show', [
            'transaction' => $data['transaction'],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'plan_id' => ['required', 'integer', 'exists:plans,id'],
            'amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:3'],
            'payment_method' => ['required', 'string', 'max:50'],
            'status' => ['required', 'in:pending,completed,failed,refunded'],
        ]);

        $user = User::findOrFail($validated['user_id']);
        $plan = Plan::findOrFail($validated['plan_id']);

        $this->transactionService->createManual($user, $plan, $validated);

        return back()->with('success', 'Manual transaction recorded successfully.');
    }
}
