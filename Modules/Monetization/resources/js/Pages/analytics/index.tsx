import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/layouts/AdminLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';

type Kpis = {
  monthly_revenue: number;
  yearly_revenue: number;
  mrr: number;
  active_subscribers: number;
  new_subscribers_this_month: number;
  total_subscribers: number;
  total_transactions: number;
  total_revenue: number;
};

type RevenueTrendItem = {
  month: string;
  short: string;
  revenue: number;
  subscriptions: number;
};

type Churn = {
  subscriber_churn_rate: number;
  user_churn_rate: number;
  canceled_this_month: number;
  active_at_start: number;
};

type RevenueByPlan = {
  plan_name: string;
  total_revenue: number;
  transaction_count: number;
};

type PaymentMethod = {
  payment_method: string;
  count: number;
  total: number;
};

type Transaction = {
  id: number;
  amount: string | number;
  currency: string;
  payment_method: string;
  transaction_id: string;
  status: string;
  created_at: string;
  user: { id: number; first_name: string | null; last_name: string | null; email: string; avatar: string | null } | null;
  plan: { id: number; name: string; slug: string } | null;
};

type RecentSubscriber = {
  id: number;
  status: string;
  payment_method: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  user: { id: number; first_name: string | null; last_name: string | null; email: string; avatar: string | null; username: string | null } | null;
  plan: { id: number; name: string; slug: string; final_price: string | number; currency: string } | null;
};

type PageProps = {
  kpis: Kpis;
  revenueTrend: RevenueTrendItem[];
  churn: Churn;
  revenueByPlan: RevenueByPlan[];
  paymentMethods: PaymentMethod[];
  recentTransactions: Transaction[];
  recentSubscribers: RecentSubscriber[];
};

const formatCurrency = (value: number): string => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `$${value.toFixed(0)}`;
  }
};

const formatCurrencyFull = (value: number): string => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
};

const formatDate = (dateString: string): string => {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(dateString));
};

const paymentStatusStyles: Record<string, string> = {
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
  refunded: 'bg-slate-100 text-slate-600 border-slate-200',
};

const subStatusStyles: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  trialing: 'bg-amber-50 text-amber-700 border-amber-200',
  past_due: 'bg-red-50 text-red-700 border-red-200',
  canceled: 'bg-slate-100 text-slate-600 border-slate-200',
  paused: 'bg-blue-50 text-blue-700 border-blue-200',
};

export default function AnalyticsIndex() {
  const { kpis, revenueTrend, churn, revenueByPlan, paymentMethods, recentTransactions, recentSubscribers } = usePage<PageProps>().props;

  const maxRevenue = Math.max(...revenueTrend.map((m) => m.revenue), 1);
  const maxPlanRevenue = Math.max(...(revenueByPlan.length > 0 ? revenueByPlan.map((p) => Number(p.total_revenue)) : [1]));
  const totalMethodPayments = paymentMethods.reduce((sum, m) => sum + m.count, 0) || 1;

  return (
    <AdminLayout title="Analytics">
      <Head title="Monetization Analytics" />

      <div className="space-y-8 pb-12">
        {/* Header */}
        <section className="relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm">
          <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-indigo-200/60 blur-3xl" />
          <div className="absolute -left-24 -bottom-24 h-48 w-48 rounded-full bg-emerald-200/70 blur-3xl" />
          <div className="relative space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Monetization</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Analytics Dashboard</h1>
            <p className="max-w-2xl text-sm text-slate-600">
              Revenue, subscriptions, and churn metrics at a glance.
            </p>
          </div>
        </section>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Monthly Revenue"
            value={formatCurrency(kpis.monthly_revenue)}
            icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
            bgIcon="bg-emerald-50"
            subtitle="This month"
          />
          <KpiCard
            title="Yearly Revenue"
            value={formatCurrency(kpis.yearly_revenue)}
            icon={<TrendingUp className="h-5 w-5 text-indigo-600" />}
            bgIcon="bg-indigo-50"
            subtitle="Year to date"
          />
          <KpiCard
            title="MRR"
            value={formatCurrency(kpis.mrr)}
            icon={<Activity className="h-5 w-5 text-violet-600" />}
            bgIcon="bg-violet-50"
            subtitle="Monthly recurring"
          />
          <KpiCard
            title="Active Subscribers"
            value={String(kpis.active_subscribers)}
            icon={<Users className="h-5 w-5 text-cyan-600" />}
            bgIcon="bg-cyan-50"
            subtitle={`+${kpis.new_subscribers_this_month} this month`}
          />
        </div>

        {/* Secondary KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            title="Total Revenue"
            value={formatCurrency(kpis.total_revenue)}
            icon={<DollarSign className="h-5 w-5 text-amber-600" />}
            bgIcon="bg-amber-50"
            subtitle="All time"
          />
          <KpiCard
            title="Total Subscribers"
            value={String(kpis.total_subscribers)}
            icon={<Users className="h-5 w-5 text-blue-600" />}
            bgIcon="bg-blue-50"
            subtitle="Unique users"
          />
          <KpiCard
            title="Total Transactions"
            value={String(kpis.total_transactions)}
            icon={<CreditCard className="h-5 w-5 text-rose-600" />}
            bgIcon="bg-rose-50"
            subtitle="All time"
          />
        </div>

        {/* Revenue Trend + Churn */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Trend Chart */}
          <Card className="lg:col-span-2 shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <CardTitle className="text-base">Revenue Trend</CardTitle>
              <CardDescription>Last 12 months</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-end gap-2 h-48">
                {revenueTrend.map((month, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="relative w-full flex justify-center">
                      <div
                        className="w-full max-w-[40px] bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-md transition-all duration-300 hover:from-indigo-600 hover:to-indigo-500 relative group"
                        style={{ height: `${Math.max((month.revenue / maxRevenue) * 160, 4)}px` }}
                      >
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          {formatCurrencyFull(month.revenue)}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">{month.short}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Churn Rates */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <CardTitle className="text-base">Churn Rates</CardTitle>
              <CardDescription>This month</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <ChurnGauge label="Subscriber Churn" rate={churn.subscriber_churn_rate} detail={`${churn.canceled_this_month} canceled / ${churn.active_at_start} active`} />
              <ChurnGauge label="User Churn" rate={churn.user_churn_rate} detail="Users without active subscription" />
            </CardContent>
          </Card>
        </div>

        {/* Revenue by Plan + Payment Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by Plan */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <CardTitle className="text-base">Revenue by Plan</CardTitle>
              <CardDescription>This month</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {revenueByPlan.length > 0 ? (
                revenueByPlan.map((plan, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-900">{plan.plan_name}</span>
                      <span className="text-slate-600">{formatCurrencyFull(Number(plan.total_revenue))} · {plan.transaction_count} txns</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                        style={{ width: `${(Number(plan.total_revenue) / maxPlanRevenue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-8">No revenue data for this month.</p>
              )}
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <CardTitle className="text-base">Payment Methods</CardTitle>
              <CardDescription>Distribution this month</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {paymentMethods.length > 0 ? (
                paymentMethods.map((method, index) => {
                  const pct = ((method.count / totalMethodPayments) * 100).toFixed(0);
                  const colors = ['bg-indigo-500', 'bg-violet-500', 'bg-cyan-500', 'bg-amber-500', 'bg-emerald-500'];
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize font-medium text-slate-900">{method.payment_method}</span>
                        <span className="text-slate-500">{pct}% · {method.count} payments · {formatCurrencyFull(Number(method.total))}</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${colors[index % colors.length]} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500 text-center py-8">No payment data for this month.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Subscribers + Recent Transactions side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Subscribers */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Subscribers</CardTitle>
                <CardDescription>Last 5 subscriptions</CardDescription>
              </div>
              <Link href="/subscriptions" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">View all →</Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {recentSubscribers.length > 0 ? (
                  recentSubscribers.map((sub) => (
                    <div key={sub.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/50 transition-colors">
                      {sub.user?.avatar ? (
                        <img src={sub.user.avatar} alt="" className="h-8 w-8 rounded-full object-cover border" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                          {sub.user?.first_name?.[0] || sub.user?.email[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {sub.user ? `${sub.user.first_name || ''} ${sub.user.last_name || ''}`.trim() || sub.user.email : '—'}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{sub.plan?.name ?? '—'} · {sub.payment_method}</p>
                      </div>
                      <Badge variant="outline" className={`capitalize text-[10px] ${subStatusStyles[sub.status] ?? ''}`}>{sub.status}</Badge>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-10 text-center text-sm text-slate-500">No subscribers yet.</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Transactions</CardTitle>
              <CardDescription>Last 5 payments</CardDescription>
            </div>
            <Link href="/transactions" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              View all →
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium">User</th>
                    <th className="px-6 py-3 text-left font-medium">Plan</th>
                    <th className="px-6 py-3 text-left font-medium">Amount</th>
                    <th className="px-6 py-3 text-left font-medium">Status</th>
                    <th className="px-6 py-3 text-left font-medium">Method</th>
                    <th className="px-6 py-3 text-left font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {recentTransactions.length > 0 ? (
                    recentTransactions.map((txn) => (
                      <tr key={txn.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            {txn.user?.avatar ? (
                              <img src={txn.user.avatar} alt="" className="h-7 w-7 rounded-full object-cover border" />
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                                {txn.user?.first_name?.[0] || txn.user?.email[0]?.toUpperCase() || '?'}
                              </div>
                            )}
                            <span className="text-slate-900 font-medium truncate max-w-[120px]">
                              {txn.user ? `${txn.user.first_name || ''} ${txn.user.last_name || ''}`.trim() || txn.user.email : '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-slate-700">{txn.plan?.name ?? '—'}</td>
                        <td className="px-6 py-3 font-semibold text-slate-900">{formatCurrencyFull(Number(txn.amount))}</td>
                        <td className="px-6 py-3">
                          <Badge variant="outline" className={`capitalize ${paymentStatusStyles[txn.status] ?? ''}`}>{txn.status}</Badge>
                        </td>
                        <td className="px-6 py-3">
                          <span className="capitalize text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-xs">{txn.payment_method}</span>
                        </td>
                        <td className="px-6 py-3 text-slate-600">{formatDate(txn.created_at)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-slate-500">No transactions yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

// ── Sub-components ──────────────────────

function KpiCard({ title, value, icon, bgIcon, subtitle }: { title: string; value: string; icon: React.ReactNode; bgIcon: string; subtitle: string }) {
  return (
    <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
          <div className={`p-2.5 rounded-xl ${bgIcon}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChurnGauge({ label, rate, detail }: { label: string; rate: number; detail: string }) {
  const color = rate <= 5 ? 'bg-emerald-500' : rate <= 15 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = rate <= 5 ? 'text-emerald-700' : rate <= 15 ? 'text-amber-700' : 'text-red-700';
  const bgColor = rate <= 5 ? 'bg-emerald-50' : rate <= 15 ? 'bg-amber-50' : 'bg-red-50';
  const Icon = rate <= 5 ? ArrowDownRight : rate <= 15 ? TrendingDown : ArrowUpRight;

  return (
    <div className={`p-4 rounded-xl border ${bgColor}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <div className={`flex items-center gap-1 text-sm font-bold ${textColor}`}>
          <Icon className="h-4 w-4" />
          {rate}%
        </div>
      </div>
      <div className="h-2 bg-white/80 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${Math.min(rate, 100)}%` }} />
      </div>
      <p className="text-[10px] text-slate-500 mt-2">{detail}</p>
    </div>
  );
}
