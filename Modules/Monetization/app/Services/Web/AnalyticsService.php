<?php

namespace Modules\Monetization\Services\Web;

use Carbon\Carbon;
use Modules\Monetization\Models\Payment;
use Modules\Monetization\Models\Subscription;

class AnalyticsService
{
    /**
     * @return array<string, mixed>
     */
    public function getDashboardData(): array
    {
        $now = Carbon::now();
        $startOfMonth = $now->copy()->startOfMonth();
        $startOfYear = $now->copy()->startOfYear();

        return [
            'kpis' => $this->getKpis($now, $startOfMonth, $startOfYear),
            'revenue_trend' => $this->getRevenueTrend($now),
            'churn' => $this->getChurnRates($now, $startOfMonth),
            'revenue_by_plan' => $this->getRevenueByPlan($startOfMonth, $now),
            'payment_methods' => $this->getPaymentMethodBreakdown($startOfMonth, $now),
            'recent_transactions' => $this->getRecentTransactions(),
            'recent_subscribers' => $this->getRecentSubscribers(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function getKpis(Carbon $now, Carbon $startOfMonth, Carbon $startOfYear): array
    {
        $monthlyRevenue = Payment::query()
            ->where('status', 'completed')
            ->whereBetween('created_at', [$startOfMonth, $now])
            ->sum('amount');

        $yearlyRevenue = Payment::query()
            ->where('status', 'completed')
            ->whereBetween('created_at', [$startOfYear, $now])
            ->sum('amount');

        $activeSubscribers = Subscription::query()
            ->where('status', 'active')
            ->count();

        $newSubscribersThisMonth = Subscription::query()
            ->whereBetween('created_at', [$startOfMonth, $now])
            ->count();

        // MRR: sum of active subscription plan prices (monthly equivalent)
        $mrr = Subscription::query()
            ->where('subscriptions.status', 'active')
            ->join('plans', 'subscriptions.plan_id', '=', 'plans.id')
            ->selectRaw('SUM(CASE
                WHEN plans.billing_interval = "monthly" THEN plans.final_price
                WHEN plans.billing_interval = "yearly" THEN plans.final_price / 12
                WHEN plans.billing_interval = "weekly" THEN plans.final_price * 4.33
                WHEN plans.billing_interval = "daily" THEN plans.final_price * 30
                ELSE plans.final_price
            END) as mrr')
            ->value('mrr') ?? 0;

        $totalSubscribers = Subscription::query()
            ->distinct('user_id')
            ->count('user_id');

        $totalTransactions = Payment::query()->count();

        $totalRevenue = Payment::query()
            ->where('status', 'completed')
            ->sum('amount');

        return [
            'monthly_revenue' => round((float) $monthlyRevenue, 2),
            'yearly_revenue' => round((float) $yearlyRevenue, 2),
            'mrr' => round((float) $mrr, 2),
            'active_subscribers' => $activeSubscribers,
            'new_subscribers_this_month' => $newSubscribersThisMonth,
            'total_subscribers' => $totalSubscribers,
            'total_transactions' => $totalTransactions,
            'total_revenue' => round((float) $totalRevenue, 2),
        ];
    }

    /**
     * Last 12 months revenue breakdown.
     *
     * @return array<int, array<string, mixed>>
     */
    private function getRevenueTrend(Carbon $now): array
    {
        $months = [];
        for ($i = 11; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i);
            $start = $month->copy()->startOfMonth();
            $end = $month->copy()->endOfMonth();

            $revenue = Payment::query()
                ->where('status', 'completed')
                ->whereBetween('created_at', [$start, $end])
                ->sum('amount');

            $subscriptions = Subscription::query()
                ->whereBetween('created_at', [$start, $end])
                ->count();

            $months[] = [
                'month' => $month->format('M Y'),
                'short' => $month->format('M'),
                'revenue' => round((float) $revenue, 2),
                'subscriptions' => $subscriptions,
            ];
        }

        return $months;
    }

    /**
     * @return array<string, mixed>
     */
    private function getChurnRates(Carbon $now, Carbon $startOfMonth): array
    {
        // Subscribers at start of month (active as of last month's end)
        $activeAtStartOfMonth = Subscription::query()
            ->where('status', 'active')
            ->where('created_at', '<', $startOfMonth)
            ->count();

        // Canceled this month
        $canceledThisMonth = Subscription::query()
            ->where('status', 'canceled')
            ->whereBetween('cancelled_at', [$startOfMonth, $now])
            ->count();

        $subscriberChurnRate = $activeAtStartOfMonth > 0
            ? round(($canceledThisMonth / $activeAtStartOfMonth) * 100, 1)
            : 0;

        // User churn: users who had active subs last month but have none now
        $usersWithActiveSubs = Subscription::query()
            ->where('status', 'active')
            ->distinct('user_id')
            ->count('user_id');

        $usersWithAnySubs = Subscription::query()
            ->distinct('user_id')
            ->count('user_id');

        $userChurnRate = $usersWithAnySubs > 0
            ? round((($usersWithAnySubs - $usersWithActiveSubs) / $usersWithAnySubs) * 100, 1)
            : 0;

        return [
            'subscriber_churn_rate' => $subscriberChurnRate,
            'user_churn_rate' => $userChurnRate,
            'canceled_this_month' => $canceledThisMonth,
            'active_at_start' => $activeAtStartOfMonth,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function getRevenueByPlan(Carbon $startOfMonth, Carbon $now): array
    {
        return Payment::query()
            ->where('payments.status', 'completed')
            ->whereBetween('payments.created_at', [$startOfMonth, $now])
            ->join('plans', 'payments.plan_id', '=', 'plans.id')
            ->select('plans.name as plan_name')
            ->selectRaw('SUM(payments.amount) as total_revenue')
            ->selectRaw('COUNT(payments.id) as transaction_count')
            ->groupBy('plans.name')
            ->orderByDesc('total_revenue')
            ->get()
            ->toArray();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function getPaymentMethodBreakdown(Carbon $startOfMonth, Carbon $now): array
    {
        return Payment::query()
            ->where('status', 'completed')
            ->whereBetween('created_at', [$startOfMonth, $now])
            ->select('payment_method')
            ->selectRaw('COUNT(*) as count')
            ->selectRaw('SUM(amount) as total')
            ->groupBy('payment_method')
            ->orderByDesc('total')
            ->get()
            ->toArray();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function getRecentTransactions(): array
    {
        return Payment::query()
            ->with([
                'user:id,first_name,last_name,email,avatar',
                'plan:id,name,slug',
            ])
            ->latest('id')
            ->limit(5)
            ->get()
            ->toArray();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function getRecentSubscribers(): array
    {
        return Subscription::query()
            ->with([
                'user:id,first_name,last_name,email,avatar,username',
                'plan:id,name,slug,final_price,currency',
            ])
            ->latest('id')
            ->limit(5)
            ->get()
            ->toArray();
    }
}
