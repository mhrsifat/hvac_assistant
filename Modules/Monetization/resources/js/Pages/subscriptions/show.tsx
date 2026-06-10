import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/layouts/AdminLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Calendar, CreditCard, Clock, Minus, Pause, Play, Plus, User as UserIcon, X } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';

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

type Payment = {
  id: number;
  amount: string | number;
  currency: string;
  payment_method: string;
  transaction_id: string;
  status: string;
  created_at: string;
  user: User;
};

type Subscription = {
  id: number;
  user: User;
  plan: Plan;
  payments: Payment[];
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'paused';
  payment_method: string;
  starts_at: string | null;
  ends_at: string | null;
  trial_ends_at: string | null;
  cancelled_at: string | null;
  provider_subscription_id: string | null;
  provider_metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type PageProps = {
  subscription: Subscription;
  flash?: {
    success?: string;
    error?: string;
  };
};

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  trialing: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  past_due: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
  canceled: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  paused: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
};

const paymentStatusStyles: Record<string, string> = {
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  pending: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  failed: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
  refunded: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
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

export default function SubscriptionsShow() {
  const { subscription, flash } = usePage<PageProps>().props;
  const [dismissedSuccess, setDismissedSuccess] = useState<string | null>(null);
  const showSuccess = Boolean(flash?.success) && flash?.success !== dismissedSuccess;

  // Cancel dialog
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  // Extend dialog
  const [isExtendOpen, setIsExtendOpen] = useState(false);
  const extendForm = useForm({ days: '30' });

  // Reduce dialog
  const [isReduceOpen, setIsReduceOpen] = useState(false);
  const reduceForm = useForm({ days: '7' });

  // Create transaction dialog
  const [isTxnOpen, setIsTxnOpen] = useState(false);
  const txnForm = useForm({
    user_id: String(subscription.user.id),
    plan_id: String(subscription.plan?.id ?? ''),
    subscription_id: String(subscription.id),
    amount: '',
    currency: subscription.plan?.currency ?? 'USD',
    payment_method: subscription.payment_method || 'manual',
    status: 'completed',
  });

  const confirmCancel = () => {
    router.post(`/subscriptions/${subscription.id}/cancel`, {}, {
      preserveScroll: true,
      onSuccess: () => setIsCancelOpen(false),
    });
  };

  const submitExtend = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    extendForm.post(`/subscriptions/${subscription.id}/extend`, {
      preserveScroll: true,
      onSuccess: () => setIsExtendOpen(false),
    });
  };

  const confirmPause = () => {
    router.post(`/subscriptions/${subscription.id}/pause`, {}, {
      preserveScroll: true,
    });
  };

  const confirmReactivate = () => {
    router.post(`/subscriptions/${subscription.id}/reactivate`, {}, {
      preserveScroll: true,
    });
  };

  const submitReduce = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    reduceForm.post(`/subscriptions/${subscription.id}/reduce`, {
      preserveScroll: true,
      onSuccess: () => setIsReduceOpen(false),
    });
  };

  const submitTxn = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    txnForm.post('/transactions', {
      preserveScroll: true,
      onSuccess: () => {
        txnForm.reset();
        setIsTxnOpen(false);
      },
    });
  };

  return (
    <AdminLayout title="Subscription Details">
      <Head title={`Subscription #${subscription.id}`} />

      <div className="space-y-6 pb-12">
        {/* Back Button */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild className="gap-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
            <Link href="/subscriptions">
              <ArrowLeft className="h-4 w-4" />
              Back to Subscriptions
            </Link>
          </Button>
        </div>

        {/* Flash message */}
        {flash?.success && showSuccess ? (
          <div className="flex items-start justify-between gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
            <span>{flash.success}</span>
            <button type="button" onClick={() => setDismissedSuccess(flash?.success ?? null)} className="rounded p-1 text-emerald-700 transition hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        {/* Top Banner */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Subscription #{subscription.id}
              </h1>
              <Badge variant="outline" className={`capitalize ${statusStyles[subscription.status] ?? ''}`}>
                {subscription.status}
              </Badge>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Created {formatDate(subscription.created_at)}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {subscription.status === 'active' || subscription.status === 'trialing' ? (
              <>
                {subscription.plan?.billing_interval !== 'lifetime' && (
                  <>
                    <Button variant="outline" size="sm" className="gap-1.5 text-amber-700 border-amber-200 hover:bg-amber-50 dark:border-amber-500/20 dark:bg-transparent dark:text-amber-400 dark:hover:bg-amber-500/10" onClick={() => {
                      extendForm.setData('days', '30'); extendForm.clearErrors(); setIsExtendOpen(true); 
                    }}>
                      <Calendar className="h-4 w-4" /> Extend
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5 text-orange-700 border-orange-200 hover:bg-orange-50 dark:border-orange-500/20 dark:bg-transparent dark:text-orange-400 dark:hover:bg-orange-500/10" onClick={() => {
                      reduceForm.setData('days', '7'); reduceForm.clearErrors(); setIsReduceOpen(true); 
                    }}>
                      <Minus className="h-4 w-4" /> Reduce
                    </Button>
                  </>
                )}
                <Button variant="outline" size="sm" className="gap-1.5 text-blue-700 border-blue-200 hover:bg-blue-50 dark:border-blue-500/20 dark:bg-transparent dark:text-blue-400 dark:hover:bg-blue-500/10" onClick={confirmPause}>
                  <Pause className="h-4 w-4" /> Pause
                </Button>
              </>
            ) : null}
            {subscription.status === 'paused' || subscription.status === 'canceled' ? (
              <Button variant="outline" size="sm" className="gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-500/20 dark:bg-transparent dark:text-emerald-400 dark:hover:bg-emerald-500/10" onClick={confirmReactivate}>
                <Play className="h-4 w-4" /> Reactivate
              </Button>
            ) : null}
            {subscription.status !== 'canceled' ? (
              <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => setIsCancelOpen(true)}>
                <X className="h-4 w-4" /> Revoke
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="space-y-6 lg:col-span-1">
            {/* User Info */}
            <Card className="shadow-sm border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4 dark:border-slate-800 dark:bg-slate-800/50">
                <CardTitle className="text-base flex items-center gap-2 dark:text-white">
                  <UserIcon className="h-4 w-4 text-indigo-500" />
                  Subscriber
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  {subscription.user.avatar ? (
                    <img src={subscription.user.avatar} alt="Avatar" className="h-12 w-12 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm dark:bg-indigo-900/50 dark:text-indigo-400">
                      {subscription.user.first_name?.[0] || subscription.user.email[0].toUpperCase()}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="font-semibold text-slate-900 truncate dark:text-white">{getUserDisplayName(subscription.user)}</p>
                    <p className="text-sm text-slate-500 truncate dark:text-slate-400">{subscription.user.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Details */}
            <Card className="shadow-sm border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4 dark:border-slate-800 dark:bg-slate-800/50">
                <CardTitle className="text-base dark:text-white">Subscription Details</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <dl className="divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
                    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Plan</dt>
                    <dd className="text-sm text-slate-900 font-medium dark:text-white">{subscription.plan?.name ?? '—'}</dd>
                  </div>
                  <div className="px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
                    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Price</dt>
                    <dd className="text-sm text-slate-900 font-medium dark:text-white">
                      {subscription.plan ? formatPrice(subscription.plan.final_price, subscription.plan.currency) : '—'}
                      {subscription.plan ? <span className="text-slate-500 font-normal ml-1 dark:text-slate-400">/{subscription.plan.billing_interval}</span> : null}
                    </dd>
                  </div>
                  <div className="px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
                    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Payment Method</dt>
                    <dd className="text-sm text-slate-900 capitalize dark:text-white">{subscription.payment_method || '—'}</dd>
                  </div>
                  <div className="px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
                    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Started</dt>
                    <dd className="text-sm text-slate-900 dark:text-white">{formatDate(subscription.starts_at)}</dd>
                  </div>
                  <div className="px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
                    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Ends At</dt>
                    <dd className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                      {subscription.plan?.billing_interval === 'lifetime' ? 'Lifetime' : formatDate(subscription.ends_at)}
                    </dd>
                  </div>
                  <div className="px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
                    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Trial Ends</dt>
                    <dd className="text-sm text-slate-900 dark:text-white">{formatDate(subscription.trial_ends_at)}</dd>
                  </div>
                  <div className="px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
                    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Cancelled At</dt>
                    <dd className="text-sm text-slate-900 dark:text-white">{formatDate(subscription.cancelled_at)}</dd>
                  </div>
                  <div className="px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
                    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Provider ID</dt>
                    <dd className="text-xs font-mono text-slate-900 bg-slate-100 px-2 py-1 rounded break-all dark:bg-slate-800 dark:text-slate-300">
                      {subscription.provider_subscription_id || 'N/A'}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Provider Metadata */}
            {subscription.provider_metadata ? (
              <Card className="shadow-sm border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4 dark:border-slate-800 dark:bg-slate-800/50">
                  <CardTitle className="text-base dark:text-white">Provider Metadata</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <pre className="max-h-64 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
                    {JSON.stringify(subscription.provider_metadata, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            ) : null}
          </div>

          {/* Right Column: Payments */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm border-slate-200 bg-white h-full dark:border-slate-800 dark:bg-slate-900">
              <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4 flex flex-row items-center justify-between dark:border-slate-800 dark:bg-slate-800/50">
                <div>
                  <CardTitle className="text-base flex items-center gap-2 dark:text-white">
                    <CreditCard className="h-4 w-4 text-indigo-500" />
                    Payment History
                  </CardTitle>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/10">
                    {subscription.payments?.length ?? 0} payment{(subscription.payments?.length ?? 0) === 1 ? '' : 's'}
                  </Badge>
                  <Button size="sm" className="gap-1.5" onClick={() => {
                    txnForm.setData({ user_id: String(subscription.user.id), plan_id: String(subscription.plan?.id ?? ''), subscription_id: String(subscription.id), amount: '', currency: subscription.plan?.currency ?? 'USD', payment_method: subscription.payment_method || 'manual', status: 'completed' }); txnForm.clearErrors(); setIsTxnOpen(true); 
                  }}>
                    <Plus className="h-3.5 w-3.5" /> Record Transaction
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-white border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                      <tr>
                        <th className="px-6 py-4 text-left font-medium">Transaction ID</th>
                        <th className="px-6 py-4 text-left font-medium">Amount</th>
                        <th className="px-6 py-4 text-left font-medium">Status</th>
                        <th className="px-6 py-4 text-left font-medium">Method</th>
                        <th className="px-6 py-4 text-left font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                      {subscription.payments && subscription.payments.length > 0 ? (
                        subscription.payments.map((payment) => (
                          <tr key={payment.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="px-6 py-4">
                              <Link
                                href={`/transactions/${payment.id}`}
                                className="font-mono text-xs text-indigo-600 hover:text-indigo-800 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300"
                              >
                                {payment.transaction_id}
                              </Link>
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                              {formatPrice(payment.amount, payment.currency)}
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant="outline" className={`capitalize ${paymentStatusStyles[payment.status] ?? ''}`}>
                                {payment.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <span className="capitalize text-slate-600 bg-slate-100 px-2 py-1 rounded text-xs font-medium dark:bg-slate-800 dark:text-slate-300">
                                {payment.payment_method}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                              {formatDate(payment.created_at)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                            No payments recorded for this subscription.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Cancel Dialog */}
        <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
          <DialogContent className="sm:max-w-lg dark:bg-slate-900 dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Revoke subscription</DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                This will cancel the subscription immediately. The user will lose access.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
              <p className="font-medium">{getUserDisplayName(subscription.user)}</p>
              <p className="text-xs text-rose-700 mt-1 dark:text-rose-400">Plan: {subscription.plan?.name ?? 'Unknown'}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCancelOpen(false)} className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Keep active</Button>
              <Button variant="destructive" onClick={confirmCancel}>Revoke subscription</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Extend Dialog */}
        <Dialog open={isExtendOpen} onOpenChange={setIsExtendOpen}>
          <DialogContent className="sm:max-w-lg dark:bg-slate-900 dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Extend subscription</DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                Add days to the subscription's end date.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submitExtend} className="space-y-4">
              <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
                <p className="font-medium">{getUserDisplayName(subscription.user)}</p>
                <p className="text-xs text-indigo-700 mt-1 dark:text-indigo-400">Current end: {formatDate(subscription.ends_at)}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Days to extend</label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={extendForm.data.days}
                  onChange={(e) => extendForm.setData('days', e.target.value)}
                  placeholder="30"
                  className={`dark:bg-slate-900 dark:text-white dark:border-slate-800 ${extendForm.errors.days ? 'border-red-500' : ''}`}
                />
                {extendForm.errors.days ? <span className="text-xs text-red-500 dark:text-red-400">{extendForm.errors.days}</span> : null}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsExtendOpen(false)} className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</Button>
                <Button type="submit" disabled={extendForm.processing}>
                  {extendForm.processing ? 'Extending...' : 'Extend subscription'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Reduce Dialog */}
        <Dialog open={isReduceOpen} onOpenChange={setIsReduceOpen}>
          <DialogContent className="sm:max-w-lg dark:bg-slate-900 dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Reduce subscription days</DialogTitle>
              <DialogDescription className="dark:text-slate-400">Subtract days from the subscription's end date.</DialogDescription>
            </DialogHeader>
            <form onSubmit={submitReduce} className="space-y-4">
              <div className="rounded-lg border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-orange-900 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400">
                <p className="font-medium">{getUserDisplayName(subscription.user)}</p>
                <p className="text-xs text-orange-700 mt-1 dark:text-orange-400">Current end: {formatDate(subscription.ends_at)}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Days to subtract</label>
                <Input type="number" min="1" max="365" value={reduceForm.data.days} onChange={(e) => reduceForm.setData('days', e.target.value)} placeholder="7" className={`dark:bg-slate-900 dark:text-white dark:border-slate-800 ${reduceForm.errors.days ? 'border-red-500' : ''}`} />
                {reduceForm.errors.days ? <span className="text-xs text-red-500 dark:text-red-400">{reduceForm.errors.days}</span> : null}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsReduceOpen(false)} className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</Button>
                <Button type="submit" variant="destructive" disabled={reduceForm.processing}>{reduceForm.processing ? 'Reducing...' : 'Reduce days'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Record Transaction Dialog */}
        <Dialog open={isTxnOpen} onOpenChange={setIsTxnOpen}>
          <DialogContent className="sm:max-w-lg dark:bg-slate-900 dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Record transaction</DialogTitle>
              <DialogDescription className="dark:text-slate-400">Record a manual payment for {getUserDisplayName(subscription.user)}.</DialogDescription>
            </DialogHeader>
            <form onSubmit={submitTxn} className="space-y-4">
              <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm dark:border-indigo-500/20 dark:bg-indigo-500/10">
                <p className="font-medium text-indigo-900 dark:text-indigo-300">{subscription.plan?.name ?? 'Unknown Plan'}</p>
                <p className="text-xs text-indigo-700 mt-0.5 dark:text-indigo-400">Subscription #{subscription.id}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Amount</label>
                  <Input type="number" step="0.01" min="0" value={txnForm.data.amount} onChange={(e) => txnForm.setData('amount', e.target.value)} placeholder="0.00" className={`dark:bg-slate-900 dark:text-white dark:border-slate-800 ${txnForm.errors.amount ? 'border-red-500' : ''}`} />
                  {txnForm.errors.amount ? <span className="text-xs text-red-500 dark:text-red-400">{txnForm.errors.amount}</span> : null}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Currency</label>
                  <Input value={txnForm.data.currency} onChange={(e) => txnForm.setData('currency', e.target.value)} maxLength={3} className="dark:bg-slate-900 dark:text-white dark:border-slate-800" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Payment method</label>
                  <Input value={txnForm.data.payment_method} onChange={(e) => txnForm.setData('payment_method', e.target.value)} className="dark:bg-slate-900 dark:text-white dark:border-slate-800" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                  <select value={txnForm.data.status} onChange={(e) => txnForm.setData('status', e.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 dark:focus-visible:ring-slate-300">
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsTxnOpen(false)} className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</Button>
                <Button type="submit" disabled={txnForm.processing}>{txnForm.processing ? 'Recording...' : 'Record transaction'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}