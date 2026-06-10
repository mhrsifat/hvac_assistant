import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/layouts/AdminLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, CreditCard, Clock, Receipt, User as UserIcon, LinkIcon } from 'lucide-react';

type User = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  avatar: string | null;
};

type Plan = {
  id: number;
  name: string;
  slug: string;
  final_price: string | number;
  currency: string;
  billing_interval: string;
  apple_product_id: string | null;
  google_product_id: string | null;
  features: string[] | null;
  trial_days: number;
  is_recommended: boolean;
  status: string;
};

type Subscription = {
  id: number;
  status: string;
  payment_method: string;
  provider_subscription_id: string | null;
  starts_at: string | null;
  ends_at: string | null;
  user: User;
};

type Transaction = {
  id: number;
  user: User;
  plan: Plan | null;
  subscription: Subscription | null;
  amount: string | number;
  currency: string;
  payment_method: string;
  transaction_id: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type PageProps = {
  transaction: Transaction;
};

const statusStyles: Record<string, string> = {
  completed: 'bg-emerald-50 dark:bg-emerald-500/10 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 dark:border-emerald-500/20',
  pending: 'bg-amber-50 dark:bg-amber-500/10 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 dark:border-amber-500/20',
  failed: 'bg-red-50 dark:bg-red-500/10 dark:bg-red-500/10 text-red-700 dark:text-red-400 dark:text-red-400 border-red-200 dark:border-red-500/20 dark:border-red-500/20',
  refunded: 'bg-slate-100 dark:bg-slate-800 dark:bg-slate-800 text-slate-600 dark:text-slate-300 dark:text-slate-300 border-slate-200 dark:border-slate-800 dark:border-slate-800',
};

const subStatusStyles: Record<string, string> = {
  active: 'bg-emerald-50 dark:bg-emerald-500/10 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 dark:border-emerald-500/20',
  trialing: 'bg-amber-50 dark:bg-amber-500/10 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 dark:border-amber-500/20',
  past_due: 'bg-red-50 dark:bg-red-500/10 dark:bg-red-500/10 text-red-700 dark:text-red-400 dark:text-red-400 border-red-200 dark:border-red-500/20 dark:border-red-500/20',
  canceled: 'bg-slate-100 dark:bg-slate-800 dark:bg-slate-800 text-slate-600 dark:text-slate-300 dark:text-slate-300 border-slate-200 dark:border-slate-800 dark:border-slate-800',
  paused: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) {
return '—';
}

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(dateString));
};

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

const getUserDisplayName = (user: User): string => {
  if (user.first_name || user.last_name) {
    return `${user.first_name || ''} ${user.last_name || ''}`.trim();
  }

  return 'No Name';
};

export default function TransactionsShow() {
  const { transaction } = usePage<PageProps>().props;

  return (
    <AdminLayout title="Transaction Details">
      <Head title={`Transaction ${transaction.transaction_id}`} />

      <div className="space-y-6 pb-12">
        {/* Back Button */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link href="/transactions">
              <ArrowLeft className="h-4 w-4" />
              Back to Transactions
            </Link>
          </Button>
        </div>

        {/* Top Banner */}
        <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white dark:text-white tracking-tight font-mono">
                {transaction.transaction_id}
              </h1>
              <Badge variant="outline" className={`capitalize ${statusStyles[transaction.status] ?? ''}`}>
                {transaction.status}
              </Badge>
            </div>
            <p className="text-slate-500 dark:text-slate-400 dark:text-slate-400 text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {formatDate(transaction.created_at)}
            </p>
          </div>

          <div className="flex flex-wrap gap-6 sm:gap-8 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-6 md:pt-0 md:pl-8">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1">Amount</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white dark:text-white">
                {formatPrice(transaction.amount, transaction.currency)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1">Method</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white dark:text-white capitalize">
                {transaction.payment_method || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="space-y-6 lg:col-span-1">
            {/* User Info */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 dark:border-slate-800">
              <CardHeader className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 dark:border-slate-800 pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-indigo-500" />
                  Payer
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  {transaction.user.avatar ? (
                    <img src={transaction.user.avatar} alt="Avatar" className="h-12 w-12 rounded-full object-cover border border-slate-200 dark:border-slate-800 dark:border-slate-800" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                      {transaction.user.first_name?.[0] || transaction.user.email[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white dark:text-white">{getUserDisplayName(transaction.user)}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400">{transaction.user.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 dark:border-slate-800">
              <CardHeader className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 dark:border-slate-800 pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-indigo-500" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <dl className="divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
                    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Transaction ID</dt>
                    <dd className="text-sm text-slate-900 dark:text-white font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs break-all">{transaction.transaction_id}</dd>
                  </div>
                  <div className="px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
                    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Amount</dt>
                    <dd className="text-sm text-slate-900 dark:text-white font-semibold">{formatPrice(transaction.amount, transaction.currency)}</dd>
                  </div>
                  <div className="px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
                    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Currency</dt>
                    <dd className="text-sm text-slate-900 dark:text-white font-medium">{transaction.currency}</dd>
                  </div>
                  <div className="px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
                    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Payment Method</dt>
                    <dd className="text-sm text-slate-900 dark:text-white capitalize">{transaction.payment_method || '—'}</dd>
                  </div>
                  <div className="px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
                    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Status</dt>
                    <dd>
                      <Badge variant="outline" className={`capitalize ${statusStyles[transaction.status] ?? ''}`}>
                        {transaction.status}
                      </Badge>
                    </dd>
                  </div>
                  <div className="px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
                    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Created</dt>
                    <dd className="text-sm text-slate-900 dark:text-white">{formatDate(transaction.created_at)}</dd>
                  </div>
                  <div className="px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
                    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Updated</dt>
                    <dd className="text-sm text-slate-900 dark:text-white">{formatDate(transaction.updated_at)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Plan Info */}
            {transaction.plan ? (
              <Card className="shadow-sm border-slate-200 dark:border-slate-800 dark:border-slate-800">
                <CardHeader className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 dark:border-slate-800 pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-indigo-500" />
                    Plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <dl className="divide-y divide-slate-100 dark:divide-slate-800">
                    <div className="px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
                      <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Name</dt>
                      <dd className="text-sm text-slate-900 dark:text-white font-semibold">
                        <Link href={`/plans/${transaction.plan.slug}`} className="text-indigo-600 hover:text-indigo-800 hover:underline">
                          {transaction.plan.name}
                        </Link>
                      </dd>
                    </div>
                    <div className="px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
                      <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Price</dt>
                      <dd className="text-sm text-slate-900 dark:text-white font-medium">
                        {formatPrice(transaction.plan.final_price, transaction.plan.currency)}
                        <span className="text-slate-500 dark:text-slate-400 font-normal ml-1">/{transaction.plan.billing_interval}</span>
                      </dd>
                    </div>
                    <div className="px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
                      <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Trial Period</dt>
                      <dd className="text-sm text-slate-900 dark:text-white">{transaction.plan.trial_days > 0 ? `${transaction.plan.trial_days} days` : 'No trial'}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            ) : null}

            {/* Linked Subscription */}
            {transaction.subscription ? (
              <Card className="shadow-sm border-slate-200 dark:border-slate-800 dark:border-slate-800">
                <CardHeader className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 dark:border-slate-800 pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-indigo-500" />
                    Linked Subscription
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <dl className="divide-y divide-slate-100 dark:divide-slate-800">
                    <div className="px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
                      <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Subscription ID</dt>
                      <dd className="text-sm">
                        <Link href={`/subscriptions/${transaction.subscription.id}`} className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium">
                          #{transaction.subscription.id}
                        </Link>
                      </dd>
                    </div>
                    <div className="px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
                      <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Status</dt>
                      <dd>
                        <Badge variant="outline" className={`capitalize ${subStatusStyles[transaction.subscription.status] ?? ''}`}>
                          {transaction.subscription.status}
                        </Badge>
                      </dd>
                    </div>
                    <div className="px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
                      <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Provider Sub ID</dt>
                      <dd className="text-sm text-slate-900 dark:text-white font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs break-all">
                        {transaction.subscription.provider_subscription_id || 'N/A'}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            ) : null}

            {/* Provider Metadata / Payload */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 dark:border-slate-800">
              <CardHeader className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 dark:border-slate-800 pb-4">
                <CardTitle className="text-base">Provider Payload</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {transaction.metadata ? (
                  <pre className="text-xs text-slate-700 dark:text-slate-300 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 dark:border-slate-800 rounded-lg p-4 overflow-x-auto max-h-96">
                    {JSON.stringify(transaction.metadata, null, 2)}
                  </pre>
                ) : (
                  <div className="text-center py-8 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 dark:border-slate-800">
                    No provider payload data available for this transaction.
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
