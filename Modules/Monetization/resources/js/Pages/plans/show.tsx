import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/layouts/AdminLayout';
import { index as plansIndex } from '@/routes/plans';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, CreditCard, Users } from 'lucide-react';

// Type Definitions
type Plan = {
  id: number;
  name: string;
  final_price: string | number;
  currency: string;
  apple_product_id: string | null;
  google_product_id: string | null;
  features: string[] | null;
  billing_interval: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'lifetime';
  trial_days: number;
  is_recommended: boolean;
  status: 'active' | 'inactive';
  subscriptions_count: number;
  payments_count: number;
  created_at: string;
};

type User = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  avatar: string | null;
};

type Subscription = {
  id: number;
  user: User;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  payment_method: string;
  created_at: string;
};

type PaginationLink = {
  url: string | null;
  label: string;
  active: boolean;
};

type PaginatedResponse<T> = {
  data: T[];
  links?: PaginationLink[];
  total: number;
};

type ShowPageProps = {
  plan: Plan;
  subscriptions: PaginatedResponse<Subscription>;
};

// Helpers
const formatPrice = (value: string | number | null | undefined, currency: string): string => {
  if (value === null || value === undefined || value === '') {
return '—';
}

  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(value));
  } catch {
    return `${currency} ${Number(value).toFixed(2)}`;
  }
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) {
return '—';
}

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateString));
};

export default function PlansShow() {
  const { plan, subscriptions } = usePage<ShowPageProps>().props;

  return (
    <AdminLayout title={`${plan.name} Details`}>
      <Head title={`${plan.name} - Plan Details`} />

      <div className="space-y-6 pb-12">
        {/* Header Actions */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link href={plansIndex.url()}>
              <ArrowLeft className="h-4 w-4" />
              Back to Plans
            </Link>
          </Button>
        </div>

        {/* Top Banner / Plan Summary */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{plan.name}</h1>
              <Badge variant={plan.status === 'active' ? 'default' : 'secondary'} className={plan.status === 'active' ? 'bg-emerald-600' : ''}>
                {plan.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
              {plan.is_recommended && (
                <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/10">
                  Recommended
                </Badge>
              )}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Created on {formatDate(plan.created_at)}
            </p>
          </div>

          <div className="flex flex-wrap gap-6 sm:gap-8 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-6 md:pt-0 md:pl-8">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Pricing</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatPrice(plan.final_price, plan.currency)}
                <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-1">/{plan.billing_interval}</span>
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Subscribers</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-500" />
                {plan.subscriptions_count}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Details & Features */}
          <div className="space-y-6 lg:col-span-1">
            {/* Integration Details */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 pb-4">
                <CardTitle className="text-base">Billing & Integration</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <dl className="divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
                    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Trial Period</dt>
                    <dd className="text-sm text-slate-900 dark:text-white font-medium">{plan.trial_days > 0 ? `${plan.trial_days} Days` : 'No Trial'}</dd>
                  </div>
                  <div className="px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
                    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Apple Product ID</dt>
                    <dd className="text-sm text-slate-900 dark:text-white font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded break-all">{plan.apple_product_id || 'Not set'}</dd>
                  </div>
                  <div className="px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
                    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Google Product ID</dt>
                    <dd className="text-sm text-slate-900 dark:text-white font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded break-all">{plan.google_product_id || 'Not set'}</dd>
                  </div>
                  <div className="px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
                    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Payments</dt>
                    <dd className="text-sm text-slate-900 dark:text-white font-medium">{plan.payments_count}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Features List */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 pb-4">
                <CardTitle className="text-base flex items-center justify-between">
                  Included Features
                  <Badge variant="outline">{plan.features?.length || 0}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {plan.features && plan.features.length > 0 ? (
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-6 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                    No features configured for this plan.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Subscribers Table */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 h-full">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Recent Subscribers</CardTitle>
                  <CardDescription>Users currently enrolled in this plan.</CardDescription>
                </div>
                <Badge variant="secondary" className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                  Total: {subscriptions.total}
                </Badge>
              </CardHeader>
              
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="px-6 py-4 text-left font-medium">Subscriber</th>
                        <th className="px-6 py-4 text-left font-medium">Status</th>
                        <th className="px-6 py-4 text-left font-medium">Started</th>
                        <th className="px-6 py-4 text-left font-medium">Method</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {subscriptions.data.length > 0 ? (
                        subscriptions.data.map((sub) => (
                          <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/25 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {sub.user.avatar ? (
                                  <img src={sub.user.avatar} alt="Avatar" className="h-8 w-8 rounded-full object-cover border border-slate-200 dark:border-slate-800" />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                                    {sub.user.first_name?.[0] || sub.user.email[0].toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-slate-900 dark:text-white">
                                    {sub.user.first_name || sub.user.last_name 
                                      ? `${sub.user.first_name || ''} ${sub.user.last_name || ''}`.trim() 
                                      : 'No Name'}
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">{sub.user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge 
                                variant="outline" 
                                className={`capitalize ${
                                  sub.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 
                                  sub.status === 'trialing' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' : 
                                  'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                                }`}
                              >
                                {sub.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                              {formatDate(sub.starts_at || sub.created_at)}
                            </td>
                            <td className="px-6 py-4">
                              <span className="capitalize text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-medium">
                                {sub.payment_method || 'N/A'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                            No active subscribers found for this plan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination for Subscribers */}
                {subscriptions.links && subscriptions.links.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-1 p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                    {subscriptions.links.map((link, index) => 
                      link.url ? (
                        <Link
                          key={index}
                          href={link.url}
                          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${link.active ? 'bg-indigo-600 text-white font-medium shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'}`}
                          dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                      ) : (
                        <span key={index} className="px-3 py-1.5 text-sm rounded-md text-slate-400 bg-slate-100/50 dark:bg-slate-800/50 cursor-not-allowed" dangerouslySetInnerHTML={{ __html: link.label }} />
                      )
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}