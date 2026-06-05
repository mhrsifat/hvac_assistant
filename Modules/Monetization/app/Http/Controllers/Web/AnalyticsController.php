<?php

namespace Modules\Monetization\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Monetization\Services\Web\AnalyticsService;

class AnalyticsController extends Controller
{
    public function __construct(
        private AnalyticsService $analyticsService,
    ) {}

    public function index(): Response
    {
        $data = $this->analyticsService->getDashboardData();

        return Inertia::render('analytics/index', [
            'kpis' => $data['kpis'],
            'revenueTrend' => $data['revenue_trend'],
            'churn' => $data['churn'],
            'revenueByPlan' => $data['revenue_by_plan'],
            'paymentMethods' => $data['payment_methods'],
            'recentTransactions' => $data['recent_transactions'],
            'recentSubscribers' => $data['recent_subscribers'],
        ]);
    }
}
