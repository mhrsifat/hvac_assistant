<?php

namespace App\Http\Controllers\Api\User;

use App\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\User\UpdateSellerProfileRequest;
use App\Http\Resources\Api\User\SellerListResource;
use App\Http\Resources\Api\User\SellerRequestResource;
use App\Http\Resources\Api\User\SellerResource;
use App\Models\Order;
use App\Models\SellerTransaction;
use App\Services\Api\User\SellerService;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SellerController extends Controller
{
    use ApiResponse;

    public function __construct(private SellerService $sellerService) {}

    /**
     * Get seller info (alias for me).
     */
    public function sellerInfo(): JsonResponse
    {
        return $this->success(200, 'Seller details fetched successfully.', [
            'user' => new SellerResource(auth('api')->user()),
        ]);
    }

    /**
     * Dashboard overview: total revenue, orders, and payouts.
     */
    public function dashboardOverview(): JsonResponse
    {
        try {
            $seller = auth('api')->user();

            $transactions = SellerTransaction::query()
                ->where('seller_id', $seller->id)
                ->get();

            $totalRevenue = round((float) $transactions->sum('gross_amount'), 2);
            $totalOrders = $transactions->pluck('order_id')->unique()->count();
            $totalPayouts = round((float) $transactions->where('status', 'paid')->sum('net_amount'), 2);

            return $this->success(200, 'Dashboard overview retrieved successfully.', [
                'total_revenue' => number_format($totalRevenue, 2, '.', ''),
                'total_orders' => $totalOrders,
                'total_payouts' => number_format($totalPayouts, 2, '.', ''),
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching dashboard overview: ' . $e->getMessage());

            return $this->error(500, $e->getMessage() ?: 'Failed to fetch dashboard overview.');
        }
    }

    /**
     * Seller finance dashboard for the transactions page.
     */
    public function transactionsDashboard(Request $request): JsonResponse
    {
        $seller = $request->user();
        $perPage = max(1, min((int) $request->query('per_page', 10), 100));
        $month = max(1, min((int) $request->query('month', now()->month), 12));
        $year = max(1970, (int) $request->query('year', now()->year));
        $status = trim((string) $request->query('status', ''));
        $startDate = Carbon::create($year, $month, 1)->startOfMonth();
        $endDate = (clone $startDate)->endOfMonth();

        $summaryQuery = SellerTransaction::query()
            ->where('seller_id', $seller->id)
            ->where('created_at', '>=', $startDate)
            ->where('created_at', '<=', $endDate);

        $baseQuery = clone $summaryQuery;

        if ($status !== '') {
            $baseQuery->where('status', $status);
        }

        $allPeriodTransactions = (clone $summaryQuery)->get();

        $totalRevenue = round(
            (float) $allPeriodTransactions->sum(fn($t) => (float) $t->net_amount),
            2
        );

        $totalPaid = round(
            (float) $allPeriodTransactions
                ->where('status', 'paid')
                ->whereNotNull('paid_at')
                ->sum(fn($t) => (float) $t->net_amount),
            2
        );

        $pendingBalance = round(
            (float) $allPeriodTransactions
                ->where('status', 'pending')
                ->sum(fn($t) => (float) $t->net_amount),
            2
        );

        $totalShipping = round((float) $allPeriodTransactions->sum(fn($t) => (float) $t->shipping_charge), 2);

        $transactions = (clone $baseQuery)
            ->with('order:id,order_number,user_id')
            ->orderByDesc('created_at')
            ->paginate($perPage);

        $mappedTransactions = collect($transactions->items())->map(function (SellerTransaction $transaction): array {
            return [
                'order_number' => $transaction->order?->order_number ?? 'N/A',
                'customer_name' => $transaction->order?->user?->name ?? 'N/A',
                'customer_email' => $transaction->order?->user?->email ?? 'N/A',
                'customer_phone' => $transaction->order?->user?->phone ?? 'N/A',
                'gross_amount' => round((float) $transaction->gross_amount, 2),
                'markup_price' => round((float) $transaction->seller_markup_price, 2),
                'shipping_charge' => round((float) $transaction->shipping_charge, 2),
                'commission_percentage' => (string) $transaction->commission_percentage . '%',
                'commission_amount' => (string) $transaction->commission_amount,
                'net_amount' => (string) $transaction->net_amount,
                'currency' => $transaction->currency ?? ($transaction->order?->currency ?? 'USD'),
                'status' => ucfirst($transaction->status),
                'date' => $transaction->created_at->format('M d, Y'),
                'paid_date' => $transaction->paid_at?->format('M d, Y') ?? 'Not paid',
                'invoice_download_url' => route('api.seller.transactions.invoice', ['id' => $transaction->id]),
            ];
        })->values();

        return $this->success(200, 'Seller transactions retrieved successfully.', [
            'summary' => [
                'total_revenue' => $totalRevenue,
                'fees_percentage' => number_format($this->resolveSellerCommissionPercentage(), 2) . '%',
                'total_paid' => $totalPaid,
                'pending_balance' => $pendingBalance,
                'month' => $month,
                'year' => $year,
            ],
            'transactions' => $mappedTransactions,
            'pagination' => [
                'current_page' => $transactions->currentPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
                'last_page' => $transactions->lastPage(),
            ],
        ]);
    }

    /**
     * Get sales chart data formatted for monthly timeline.
     */
    public function salesChartData(Request $request): JsonResponse
    {
        try {
            $seller = auth('api')->user();

            $monthInput = $request->query('month');
            $yearInput = $request->query('year');

            $year = now()->year;
            $month = now()->month;

            if ($monthInput) {
                if (is_numeric($monthInput)) {
                    $month = (int) $monthInput;
                } else {
                    try {
                        $parsed = Carbon::parse($monthInput);
                        $month = $parsed->month;
                        if (preg_match('/\b\d{4}\b/', $monthInput, $matches)) {
                            $year = (int) $matches[0];
                        }
                    } catch (Exception $e) {
                        // Fallback
                    }
                }
            }

            if ($yearInput && is_numeric($yearInput)) {
                $year = (int) $yearInput;
            }

            $startDate = Carbon::create($year, $month, 1)->startOfMonth();
            $endDate = (clone $startDate)->endOfMonth();

            $daysInMonth = $startDate->daysInMonth;
            $days = [];

            for ($day = 1; $day <= $daysInMonth; $day++) {
                $days[$day] = [
                    'day' => $day,
                    'date' => $startDate->copy()->day($day)->format('Y-m-d'),
                    'label' => $startDate->copy()->day($day)->format('d M'),
                    'sales' => 0.0,
                    'net_amount' => 0.0,
                    'commission' => 0.0,
                    'order_count' => 0,
                ];
            }

            $transactions = SellerTransaction::query()
                ->where('seller_id', $seller->id)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get();

            $ordersPerDay = [];
            foreach ($transactions as $transaction) {
                $day = $transaction->created_at->day;
                if (isset($days[$day])) {
                    $days[$day]['sales'] += (float) $transaction->gross_amount;
                    $days[$day]['net_amount'] += (float) $transaction->net_amount;
                    $days[$day]['commission'] += (float) $transaction->commission_amount;

                    if (! isset($ordersPerDay[$day])) {
                        $ordersPerDay[$day] = [];
                    }
                    if (! in_array($transaction->order_id, $ordersPerDay[$day])) {
                        $ordersPerDay[$day][] = $transaction->order_id;
                    }
                }
            }

            $labels = [];
            $salesData = [];
            $netAmountData = [];
            $commissionData = [];
            $orderCountData = [];
            $totalSales = 0.0;
            $totalNetAmount = 0.0;
            $totalCommission = 0.0;

            for ($day = 1; $day <= $daysInMonth; $day++) {
                $days[$day]['order_count'] = isset($ordersPerDay[$day]) ? count($ordersPerDay[$day]) : 0;
                $days[$day]['sales'] = round($days[$day]['sales'], 2);
                $days[$day]['net_amount'] = round($days[$day]['net_amount'], 2);
                $days[$day]['commission'] = round($days[$day]['commission'], 2);

                $labels[] = $days[$day]['label'];
                $salesData[] = $days[$day]['sales'];
                $netAmountData[] = $days[$day]['net_amount'];
                $commissionData[] = $days[$day]['commission'];
                $orderCountData[] = $days[$day]['order_count'];

                $totalSales += $days[$day]['sales'];
                $totalNetAmount += $days[$day]['net_amount'];
                $totalCommission += $days[$day]['commission'];
            }

            $totalOrders = $transactions->pluck('order_id')->unique()->count();

            return $this->success(200, 'Sales chart data fetched successfully.', [
                'chart_data' => array_values($days),
                'labels' => $labels,
                'datasets' => [
                    'sales' => $salesData,
                    'net_amount' => $netAmountData,
                    'commission' => $commissionData,
                    'order_count' => $orderCountData,
                ],
                'summary' => [
                    'total_sales' => round($totalSales, 2),
                    'total_net_amount' => round($totalNetAmount, 2),
                    'total_commission' => round($totalCommission, 2),
                    'total_orders' => $totalOrders,
                ],
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching sales chart data: ' . $e->getMessage());

            return $this->error(500, $e->getMessage() ?: 'Failed to fetch sales chart data.');
        }
    }

    /**
     * Get sales and profit graph data for the current month.
     */
    public function salesProfitGraphData(Request $request): JsonResponse
    {
        try {
            $seller = auth('api')->user();
            $month = max(1, min((int) $request->query('month', now()->month), 12));
            $year = max(1970, (int) $request->query('year', now()->year));

            $startDate = Carbon::create($year, $month, 1)->startOfMonth();
            $endDate = (clone $startDate)->endOfMonth();

            $transactions = SellerTransaction::query()
                ->where('seller_id', $seller->id)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get();

            $chartData = [];
            $currentDate = (clone $startDate)->startOfDay();

            while ($currentDate->lte($endDate)) {
                $dayTransactions = $transactions->filter(fn($t) => $t->created_at->format('Y-m-d') === $currentDate->format('Y-m-d'));

                $grossAmount = round((float) $dayTransactions->sum('gross_amount'), 2);
                $profit = round((float) $dayTransactions->sum(fn($t) => (float) $t->net_amount), 2);

                $chartData[] = [
                    'date' => $currentDate->format('M d'),
                    'sales' => $grossAmount,
                    'profit' => $profit,
                ];

                $currentDate->addDay();
            }

            return $this->success(200, 'Sales profit graph data retrieved successfully.', [
                'chart_data' => $chartData,
                'month' => $month,
                'year' => $year,
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching sales profit graph: ' . $e->getMessage());

            return $this->error(500, $e->getMessage() ?: 'Failed to fetch sales profit graph.');
        }
    }

    /**
     * Get refunds and deliveries data for the current month.
     */
    public function refundsDeliveriesData(Request $request): JsonResponse
    {
        try {
            $seller = auth('api')->user();
            $month = max(1, min((int) $request->query('month', now()->month), 12));
            $year = max(1970, (int) $request->query('year', now()->year));

            $startDate = Carbon::create($year, $month, 1)->startOfMonth();
            $endDate = (clone $startDate)->endOfMonth();

            $transactions = SellerTransaction::query()
                ->where('seller_id', $seller->id)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->with('order')
                ->get();

            $deliveredCount = 0;
            $refundedCount = 0;
            $totalRefundAmount = 0;

            foreach ($transactions as $transaction) {
                $order = $transaction->order;

                if ($order && $order->fulfillment_status === 'delivered') {
                    $deliveredCount++;
                }

                if ($order && $order->status === 'cancelled') {
                    $refundedCount++;
                    $totalRefundAmount += (float) $transaction->net_amount;
                }
            }

            return $this->success(200, 'Refunds and deliveries data retrieved successfully.', [
                'delivered_count' => $deliveredCount,
                'refunded_count' => $refundedCount,
                'total_refund_amount' => round($totalRefundAmount, 2),
                'month' => $month,
                'year' => $year,
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching refunds and deliveries data: ' . $e->getMessage());

            return $this->error(500, $e->getMessage() ?: 'Failed to fetch refunds and deliveries data.');
        }
    }

    /**
     * Get a list of months and years since system inception.
     */
    public function monthYearList(): JsonResponse
    {
        $start = Carbon::create(2026, 5, 1)->startOfMonth();
        $current = now()->startOfMonth();

        $months = [];

        while ($start->lte($current)) {
            $months[] = $start->format('M Y');
            $start->addMonth();
        }

        return $this->success(200, 'Month-year list fetched successfully.', [
            'months' => $months,
        ]);
    }

    /**
     * Update seller profile information.
     */
    public function updateProfile(UpdateSellerProfileRequest $request): JsonResponse
    {
        try {
            $user = auth('api')->user();
            $avatar = $request->file('avatar');
            $coverPhoto = $request->file('cover_photo');

            $updatedUser = $this->sellerService->updateProfile(
                $user,
                $request->validated(),
                $avatar,
                $coverPhoto
            );

            return $this->success(200, 'Profile updated successfully.', [
                'user' => new SellerResource($updatedUser),
            ]);
        } catch (Exception $e) {
            Log::error('Error updating seller profile: ' . $e->getMessage());

            return $this->error(500, $e->getMessage() ?: 'Failed to update profile.');
        }
    }

    /**
     * Get details for a specific seller by ID.
     */
    public function sellerDetails(int $id): JsonResponse
    {
        try {
            $seller = $this->sellerService->findSellerById($id);

            $returnData['status'] = $seller->status;
            $returnData['seller'] = new SellerResource($seller);

            return $this->success(200, 'Seller details fetched successfully.', $returnData);
        } catch (Exception $e) {
            Log::error('Error fetching seller details: ' . $e->getMessage());

            return $this->error(404, $e->getMessage() ?: 'Seller not found.');
        }
    }

    /**
     * Fetch incoming requests from sellers wanting to join.
     */
    public function sellerRequestList(): JsonResponse
    {
        try {
            $perPage = request('per_page', 15);
            $sellers = $this->sellerService->getSellerRequests($perPage);

            return $this->success(200, 'Seller request list fetched successfully.', [
                'sellers' => SellerRequestResource::collection($sellers),
                'pagination' => [
                    'total' => $sellers->total(),
                    'per_page' => $sellers->perPage(),
                    'current_page' => $sellers->currentPage(),
                    'last_page' => $sellers->lastPage(),
                ],
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching seller request list: ' . $e->getMessage());

            return $this->error(500, $e->getMessage() ?: 'Failed to fetch seller request list.');
        }
    }

    /**
     * Fetch a paginated list of all active/registered sellers.
     */
    public function allSellerList(): JsonResponse
    {
        try {
            $perPage = request('per_page', 15);
            $sellers = $this->sellerService->getAllSellers($perPage);

            return $this->success(200, 'Seller list fetched successfully.', [
                'sellers' => SellerListResource::collection($sellers),
                'pagination' => [
                    'total' => $sellers->total(),
                    'per_page' => $sellers->perPage(),
                    'current_page' => $sellers->currentPage(),
                    'last_page' => $sellers->lastPage(),
                ],
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching all seller list: ' . $e->getMessage());

            return $this->error(500, $e->getMessage() ?: 'Failed to fetch seller list.');
        }
    }

    /**
     * Approve and accept a pending seller request.
     */
    public function acceptSeller(int $id): JsonResponse
    {
        try {
            $seller = $this->sellerService->acceptSeller($id);

            return $this->success(200, 'Seller accepted successfully.', [
                'seller' => new SellerResource($seller),
            ]);
        } catch (Exception $e) {
            Log::error('Error accepting seller: ' . $e->getMessage());

            return $this->error(500, $e->getMessage() ?: 'Failed to accept seller.');
        }
    }

    /**
     * Decline and reject a pending seller request.
     */
    public function rejectSeller(int $id): JsonResponse
    {
        try {
            $seller = $this->sellerService->rejectSeller($id);

            return $this->success(200, 'Seller rejected successfully.', [
                'seller' => new SellerResource($seller),
            ]);
        } catch (Exception $e) {
            Log::error('Error rejecting seller: ' . $e->getMessage());

            return $this->error(500, $e->getMessage() ?: 'Failed to reject seller.');
        }
    }

    /**
     * Toggle the active status of a seller profile.
     */
    public function toggleStatus(int $id): JsonResponse
    {
        try {
            $seller = $this->sellerService->toggleSellerStatus($id);

            $returnData['status'] = $seller->status;
            $returnData['seller'] = new SellerResource($seller);

            return $this->success(200, 'Seller status updated successfully.', $returnData);
        } catch (Exception $e) {
            Log::error('Error toggling seller status: ' . $e->getMessage());

            return $this->error(500, $e->getMessage() ?: 'Failed to update seller status.');
        }
    }

    /**
     * Permanently delete a seller account.
     */
    public function deleteSeller(int $id): JsonResponse
    {
        try {
            $this->sellerService->deleteSeller($id);

            return $this->success(200, 'Seller deleted successfully.');
        } catch (Exception $e) {
            Log::error('Error deleting seller: ' . $e->getMessage());

            return $this->error(500, $e->getMessage() ?: 'Failed to delete seller.');
        }
    }

    /**
     * Resolve the current commission percentage dynamic or configured.
     */
    private function resolveSellerCommissionPercentage(): float
    {
        $seller = auth('api')->user();

        $subscriptions = $seller->subscriptions()->with('plan')->latest('id')->paginate(1);
        $plan = $subscriptions->first()?->plan;
        if ($plan) {
            return round((float) $plan->commission_percentage, 2);
        }

        return (float) 0.00;
    }
}
