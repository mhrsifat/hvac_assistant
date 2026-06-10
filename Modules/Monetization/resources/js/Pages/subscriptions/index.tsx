import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Deferred, Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Calendar, Eye, Minus, Pause, Play, Plus, Search, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type {FormEvent} from 'react';

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
};

type Subscription = {
  id: number;
  user: User;
  plan: Plan;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'paused';
  payment_method: string;
  starts_at: string | null;
  ends_at: string | null;
  trial_ends_at: string | null;
  cancelled_at: string | null;
  provider_subscription_id: string | null;
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
};

type PlanOption = {
  id: number;
  name: string;
  slug: string;
};

type PageProps = {
  subscriptions?: PaginatedResponse<Subscription>;
  plans: PlanOption[];
  filters: {
    search: string;
    status: string;
  };
  flash?: {
    success?: string;
    error?: string;
  };
};

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-50 dark:bg-emerald-500/10 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 dark:border-emerald-500/20',
  trialing: 'bg-amber-50 dark:bg-amber-500/10 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 dark:border-amber-500/20',
  past_due: 'bg-red-50 dark:bg-red-500/10 dark:bg-red-500/10 text-red-700 dark:text-red-400 dark:text-red-400 border-red-200 dark:border-red-500/20 dark:border-red-500/20',
  canceled: 'bg-slate-100 dark:bg-slate-800 dark:bg-slate-800 text-slate-600 dark:text-slate-300 dark:text-slate-300 border-slate-200 dark:border-slate-800 dark:border-slate-800',
  paused: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
};

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'trialing', label: 'Trialing' },
  { value: 'past_due', label: 'Past Due' },
  { value: 'canceled', label: 'Canceled' },
  { value: 'paused', label: 'Paused' },
];

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

const getUserDisplayName = (user: User): string => {
  if (user.first_name || user.last_name) {
    return `${user.first_name || ''} ${user.last_name || ''}`.trim();
  }

  return 'No Name';
};

export default function SubscriptionsIndex() {
  const { subscriptions, plans, filters, flash } = usePage<PageProps>().props;
  const [dismissedSuccess, setDismissedSuccess] = useState<string | null>(null);
  const [dismissedError, setDismissedError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState(filters.search ?? '');
  const [statusValue, setStatusValue] = useState(filters.status ?? '');

  // Cancel dialog
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Subscription | null>(null);

  // Extend dialog
  const [isExtendOpen, setIsExtendOpen] = useState(false);
  const [extendTarget, setExtendTarget] = useState<Subscription | null>(null);
  const extendForm = useForm({ days: '30' });

  // Reduce dialog
  const [isReduceOpen, setIsReduceOpen] = useState(false);
  const [reduceTarget, setReduceTarget] = useState<Subscription | null>(null);
  const reduceForm = useForm({ days: '7' });

  // Create manual subscription dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const createForm = useForm({
    user_id: '',
    plan_id: '',
    payment_method: 'manual',
    starts_at: new Date().toISOString().split('T')[0],
    ends_at: new Date(new Date().getTime() + 30 * 86400000).toISOString().split('T')[0],
    status: 'active',
  });

  // User search for create dialog
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const userSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchUsers = (query: string) => {
    setUserQuery(query);
    setSelectedUser(null);
    createForm.setData('user_id', '');

    if (userSearchTimerRef.current) {
clearTimeout(userSearchTimerRef.current);
}

    if (query.length < 2) {
 setUserResults([]);

 return; 
}

    userSearchTimerRef.current = setTimeout(async () => {
      setUserSearchLoading(true);

      try {
        const res = await fetch(`/user-search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setUserResults(data);
      } catch {
 setUserResults([]); 
}

      setUserSearchLoading(false);
    }, 300);
  };

  const pickUser = (user: User) => {
    setSelectedUser(user);
    createForm.setData('user_id', String(user.id));
    setUserQuery('');
    setUserResults([]);
  };


  const applyFilters = () => {
    router.get(
      '/subscriptions',
      {
        ...(searchValue ? { search: searchValue } : {}),
        ...(statusValue ? { status: statusValue } : {}),
      },
      { preserveState: true, preserveScroll: true },
    );
  };

  const clearFilters = () => {
    setSearchValue('');
    setStatusValue('');
    router.get('/subscriptions', {}, { preserveState: true, preserveScroll: true });
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applyFilters();
  };

  const handleStatusChange = (value: string) => {
    setStatusValue(value);
    router.get(
      '/subscriptions',
      {
        ...(searchValue ? { search: searchValue } : {}),
        ...(value ? { status: value } : {}),
      },
      { preserveState: true, preserveScroll: true },
    );
  };

  const openCancelDialog = (subscription: Subscription) => {
    setCancelTarget(subscription);
    setIsCancelOpen(true);
  };

  const confirmCancel = () => {
    if (!cancelTarget) {
return;
}

    router.post(`/subscriptions/${cancelTarget.id}/cancel`, {}, {
      preserveScroll: true,
      onSuccess: () => {
        setIsCancelOpen(false);
        setCancelTarget(null);
      },
    });
  };

  const openExtendDialog = (subscription: Subscription) => {
    setExtendTarget(subscription);
    extendForm.setData('days', '30');
    extendForm.clearErrors();
    setIsExtendOpen(true);
  };

  const submitExtend = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!extendTarget) {
return;
}

    extendForm.post(`/subscriptions/${extendTarget.id}/extend`, {
      preserveScroll: true,
      onSuccess: () => {
        setIsExtendOpen(false);
        setExtendTarget(null);
      },
    });
  };

  const openReduceDialog = (subscription: Subscription) => {
    setReduceTarget(subscription);
    reduceForm.setData('days', '7');
    reduceForm.clearErrors();
    setIsReduceOpen(true);
  };

  const submitReduce = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!reduceTarget) {
return;
}

    reduceForm.post(`/subscriptions/${reduceTarget.id}/reduce`, {
      preserveScroll: true,
      onSuccess: () => {
        setIsReduceOpen(false);
        setReduceTarget(null);
      },
    });
  };

  const confirmPause = (sub: Subscription) => {
    router.post(`/subscriptions/${sub.id}/pause`, {}, { preserveScroll: true });
  };

  const confirmReactivate = (sub: Subscription) => {
    router.post(`/subscriptions/${sub.id}/reactivate`, {}, { preserveScroll: true });
  };

  const submitCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createForm.post('/subscriptions', {
      preserveScroll: true,
      onSuccess: () => {
        createForm.reset();
        setIsCreateOpen(false);
      },
    });
  };

  return (
    <AdminLayout title="Subscriptions">
      <Head title="Subscriptions" />

      <div className="space-y-8">
        {/* Header */}
        <section className="relative overflow-hidden rounded-2xl border bg-white dark:bg-slate-900 dark:bg-slate-900 p-6 shadow-sm">
          <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-indigo-200/60 blur-3xl" />
          <div className="absolute -left-24 -bottom-24 h-48 w-48 rounded-full bg-violet-200/70 blur-3xl" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 dark:text-slate-400">
                Monetization
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white dark:text-white">
                Subscriptions
              </h1>
              <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300 dark:text-slate-300">
                View and manage all user subscriptions. Revoke access or extend billing periods.
              </p>
            </div>
            <Button className="gap-2" onClick={() => {
 createForm.clearErrors(); setIsCreateOpen(true); 
}}>
              <Plus className="h-4 w-4" />
              Create Manual
            </Button>
          </div>
        </section>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <form onSubmit={handleSearch} className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search by name, email, or provider ID..."
              className="pl-10"
            />
          </form>
          <select
            value={statusValue}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="h-10 rounded-md border border-slate-200 dark:border-slate-800 dark:border-slate-800 bg-white dark:bg-slate-900 dark:bg-slate-900 px-3 text-sm text-slate-700 dark:text-slate-300 dark:text-slate-300"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {(filters.search || filters.status) ? (
            <Button type="button" variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-slate-500 dark:text-slate-400 dark:text-slate-400">
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          ) : null}
        </div>

        {/* Flash messages */}
        {flash?.success && dismissedSuccess !== flash.success ? (
          <div className="flex items-start justify-between gap-3 rounded-md border border-emerald-200 dark:border-emerald-500/20 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 dark:bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400 dark:text-emerald-400">
            <span>{flash.success}</span>
            <button type="button" onClick={() => setDismissedSuccess(flash?.success ?? null)} className="rounded p-1 text-emerald-700 dark:text-emerald-400 dark:text-emerald-400/80 transition hover:text-emerald-900" aria-label="Dismiss success message">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        {flash?.error && dismissedError !== flash.error ? (
          <div className="flex items-start justify-between gap-3 rounded-md border border-red-200 dark:border-red-500/20 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 dark:bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400 dark:text-red-400">
            <span>{flash.error}</span>
            <button type="button" onClick={() => setDismissedError(flash?.error ?? null)} className="rounded p-1 text-red-700 dark:text-red-400 dark:text-red-400/80 transition hover:text-red-900" aria-label="Dismiss error message">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        {/* Table */}
        <Deferred
          data="subscriptions"
          fallback={
            <div className="space-y-2">
              <div className="h-16 animate-pulse rounded-md bg-gray-200 dark:bg-zinc-800" />
              <div className="h-16 animate-pulse rounded-md bg-gray-200 dark:bg-zinc-800" />
              <div className="h-16 animate-pulse rounded-md bg-gray-200 dark:bg-zinc-800" />
              <div className="h-16 animate-pulse rounded-md bg-gray-200 dark:bg-zinc-800" />
            </div>
          }
        >
          {() => (
            <div className="overflow-hidden rounded-2xl border bg-white dark:bg-slate-900 dark:bg-slate-900 shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-4 text-left">User</th>
                      <th className="px-4 py-4 text-left">Plan</th>
                      <th className="px-4 py-4 text-left">Status</th>
                      <th className="px-4 py-4 text-left">Method</th>
                      <th className="px-4 py-4 text-left">Started</th>
                      <th className="px-4 py-4 text-left">Ends At</th>
                      <th className="px-4 py-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions?.data.length ? (
                      subscriptions.data.map((sub) => (
                        <tr key={sub.id} className="border-b last:border-b-0 align-top hover:bg-slate-50 dark:hover:bg-slate-800/25 dark:bg-slate-800/50 dark:hover:bg-slate-800/25 dark:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              {sub.user.avatar ? (
                                <img src={sub.user.avatar} alt="Avatar" className="h-8 w-8 rounded-full object-cover border border-slate-200 dark:border-slate-800 dark:border-slate-800" />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                                  {sub.user.first_name?.[0] || sub.user.email[0].toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white dark:text-white">
                                  {getUserDisplayName(sub.user)}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400">{sub.user.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <p className="font-medium text-slate-900 dark:text-white dark:text-white">{sub.plan?.name ?? '—'}</p>
                          </td>

                          <td className="px-4 py-4">
                            <Badge
                              variant="outline"
                              className={`capitalize ${statusStyles[sub.status] ?? ''}`}
                            >
                              {sub.status}
                            </Badge>
                          </td>

                          <td className="px-4 py-4">
                            <span className="capitalize text-slate-600 dark:text-slate-300 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 dark:bg-slate-800 px-2 py-1 rounded text-xs font-medium">
                              {sub.payment_method || 'N/A'}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-slate-600 dark:text-slate-300 dark:text-slate-300">
                            {formatDate(sub.starts_at || sub.created_at)}
                          </td>

                          <td className="px-4 py-4 text-slate-600 dark:text-slate-300 dark:text-slate-300">
                            {sub.plan?.billing_interval === 'lifetime' ? (
                              <span className="font-semibold text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:bg-violet-500/10 border border-violet-100 px-2 py-0.5 rounded text-xs">
                                Lifetime
                              </span>
                            ) : formatDate(sub.ends_at)}
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="gap-1.5"
                                onClick={() => router.get(`/subscriptions/${sub.id}`)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View
                              </Button>
                              {sub.status === 'active' || sub.status === 'trialing' ? (
                                <>
                                  {sub.plan?.billing_interval !== 'lifetime' && (
                                    <>
                                      <Button type="button" size="sm" variant="outline" className="gap-1.5 text-amber-700 dark:text-amber-400 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 dark:border-amber-500/20 hover:bg-amber-50 dark:bg-amber-500/10 dark:bg-amber-500/10" onClick={() => openExtendDialog(sub)}>
                                        <Calendar className="h-3.5 w-3.5" /> Extend
                                      </Button>
                                      <Button type="button" size="sm" variant="outline" className="gap-1.5 text-orange-700 border-orange-200 hover:bg-orange-50" onClick={() => openReduceDialog(sub)}>
                                        <Minus className="h-3.5 w-3.5" /> Reduce
                                      </Button>
                                    </>
                                  )}
                                  <Button type="button" size="sm" variant="outline" className="gap-1.5 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 hover:bg-blue-50 dark:bg-blue-500/10" onClick={() => confirmPause(sub)}>
                                    <Pause className="h-3.5 w-3.5" /> Pause
                                  </Button>
                                </>
                              ) : null}
                              {sub.status === 'paused' ? (
                                <Button type="button" size="sm" variant="outline" className="gap-1.5 text-emerald-700 dark:text-emerald-400 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 dark:border-emerald-500/20 hover:bg-emerald-50 dark:bg-emerald-500/10 dark:bg-emerald-500/10" onClick={() => confirmReactivate(sub)}>
                                  <Play className="h-3.5 w-3.5" /> Reactivate
                                </Button>
                              ) : null}
                              {sub.status === 'canceled' ? (
                                <Button type="button" size="sm" variant="outline" className="gap-1.5 text-emerald-700 dark:text-emerald-400 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 dark:border-emerald-500/20 hover:bg-emerald-50 dark:bg-emerald-500/10 dark:bg-emerald-500/10" onClick={() => confirmReactivate(sub)}>
                                  <Play className="h-3.5 w-3.5" /> Reactivate
                                </Button>
                              ) : null}
                              {sub.status !== 'canceled' ? (
                                <Button type="button" size="sm" variant="destructive" className="gap-1.5" onClick={() => openCancelDialog(sub)}>
                                  <X className="h-3.5 w-3.5" /> Revoke
                                </Button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400" colSpan={7}>
                          No subscriptions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {subscriptions?.links && subscriptions.links.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2 border-t bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 px-4 py-3 text-sm">
                  {subscriptions.links.map((link, index) =>
                    link.url ? (
                      <Link
                        key={index}
                        href={link.url}
                        className={`rounded-full border px-3 py-1 transition ${link.active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 dark:border-slate-800 dark:border-slate-800 bg-white dark:bg-slate-900 dark:bg-slate-900 text-slate-600 dark:text-slate-300 dark:text-slate-300'}`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                      />
                    ) : (
                      <span
                        key={index}
                        className="rounded-full border border-slate-200 dark:border-slate-800 dark:border-slate-800 px-3 py-1 text-slate-400"
                        dangerouslySetInnerHTML={{ __html: link.label }}
                      />
                    ),
                  )}
                </div>
              ) : null}
            </div>
          )}
        </Deferred>

        {/* Cancel Confirmation Dialog */}
        <Dialog
          open={isCancelOpen}
          onOpenChange={(open) => {
            setIsCancelOpen(open);

            if (!open) {
setCancelTarget(null);
}
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Revoke subscription</DialogTitle>
              <DialogDescription>
                This will cancel the subscription immediately. The user will lose access.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 px-4 py-3 text-sm text-rose-900 dark:text-rose-400">
              <p className="font-medium">{getUserDisplayName(cancelTarget?.user ?? { id: 0, first_name: null, last_name: null, email: '', avatar: null })}</p>
              <p className="text-xs text-rose-700 mt-1">Plan: {cancelTarget?.plan?.name ?? 'Unknown'}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCancelOpen(false)}>
                Keep active
              </Button>
              <Button variant="destructive" onClick={confirmCancel}>
                Revoke subscription
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Extend Dialog */}
        <Dialog
          open={isExtendOpen}
          onOpenChange={(open) => {
            setIsExtendOpen(open);

            if (!open) {
setExtendTarget(null);
}
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Extend subscription</DialogTitle>
              <DialogDescription>
                Add days to the subscription's end date. This will also reactivate canceled subscriptions.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submitExtend} className="space-y-4">
              <div className="rounded-lg border border-indigo-100 bg-indigo-50 dark:bg-indigo-500/10 dark:bg-indigo-500/10 px-4 py-3 text-sm text-indigo-900">
                <p className="font-medium">{getUserDisplayName(extendTarget?.user ?? { id: 0, first_name: null, last_name: null, email: '', avatar: null })}</p>
                <p className="text-xs text-indigo-700 dark:text-indigo-400 dark:text-indigo-400 mt-1">
                  Current end: {formatDate(extendTarget?.ends_at ?? null)}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300">Days to extend</label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={extendForm.data.days}
                  onChange={(e) => extendForm.setData('days', e.target.value)}
                  placeholder="30"
                  className={extendForm.errors.days ? 'border-red-500' : ''}
                />
                {extendForm.errors.days ? <span className="text-xs text-red-500">{extendForm.errors.days}</span> : null}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsExtendOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={extendForm.processing}>
                  {extendForm.processing ? 'Extending...' : 'Extend subscription'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Reduce Dialog */}
        <Dialog
          open={isReduceOpen}
          onOpenChange={(open) => {
            setIsReduceOpen(open);

            if (!open) {
setReduceTarget(null);
}
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Reduce subscription days</DialogTitle>
              <DialogDescription>
                Subtract days from the subscription's end date.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submitReduce} className="space-y-4">
              <div className="rounded-lg border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-orange-900">
                <p className="font-medium">{getUserDisplayName(reduceTarget?.user ?? { id: 0, first_name: null, last_name: null, email: '', avatar: null })}</p>
                <p className="text-xs text-orange-700 mt-1">Current end: {formatDate(reduceTarget?.ends_at ?? null)}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300">Days to subtract</label>
                <Input type="number" min="1" max="365" value={reduceForm.data.days} onChange={(e) => reduceForm.setData('days', e.target.value)} placeholder="7" className={reduceForm.errors.days ? 'border-red-500' : ''} />
                {reduceForm.errors.days ? <span className="text-xs text-red-500">{reduceForm.errors.days}</span> : null}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsReduceOpen(false)}>Cancel</Button>
                <Button type="submit" variant="destructive" disabled={reduceForm.processing}>{reduceForm.processing ? 'Reducing...' : 'Reduce days'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Create Manual Subscription Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create manual subscription</DialogTitle>
              <DialogDescription>Manually assign a subscription to a user.</DialogDescription>
            </DialogHeader>
            <form onSubmit={submitCreate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300">User</label>
                {selectedUser ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-indigo-200 dark:border-indigo-500/20 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 dark:bg-indigo-500/10">
                    {selectedUser.avatar ? (
                      <img src={selectedUser.avatar} alt="" className="h-8 w-8 rounded-full object-cover border" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-indigo-200 text-indigo-700 dark:text-indigo-400 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">
                        {selectedUser.first_name?.[0] || selectedUser.email[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white dark:text-white truncate">{getUserDisplayName(selectedUser)}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 truncate">{selectedUser.email}</p>
                    </div>
                    <button type="button" onClick={() => {
 setSelectedUser(null); createForm.setData('user_id', ''); 
}} className="text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:text-slate-300">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      value={userQuery}
                      onChange={(e) => searchUsers(e.target.value)}
                      placeholder="Search by name, email, or username..."
                      className={createForm.errors.user_id ? 'border-red-500' : ''}
                      autoComplete="off"
                    />
                    {userSearchLoading ? (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                      </div>
                    ) : null}
                    {userResults.length > 0 ? (
                      <div className="absolute z-50 top-full mt-1 w-full bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 dark:border-slate-800 rounded-lg shadow-lg max-h-48 overflow-auto">
                        {userResults.map((u) => (
                          <button key={u.id} type="button" onClick={() => pickUser(u)} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/25 dark:bg-slate-800/50 dark:hover:bg-slate-800/25 dark:bg-slate-800/50 text-left transition-colors">
                            {u.avatar ? (
                              <img src={u.avatar} alt="" className="h-7 w-7 rounded-full object-cover border" />
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 dark:text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                                {u.first_name?.[0] || u.email[0].toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-900 dark:text-white dark:text-white truncate">{getUserDisplayName(u)}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 truncate">{u.email}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
                {createForm.errors.user_id ? <span className="text-xs text-red-500">{createForm.errors.user_id}</span> : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300">Plan</label>
                <select value={createForm.data.plan_id} onChange={(e) => createForm.setData('plan_id', e.target.value)} className={`h-10 w-full rounded-md border px-3 text-sm ${createForm.errors.plan_id ? 'border-red-500' : 'border-slate-200 dark:border-slate-800 dark:border-slate-800'}`}>
                  <option value="">Select a plan</option>
                  {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {createForm.errors.plan_id ? <span className="text-xs text-red-500">{createForm.errors.plan_id}</span> : null}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300">Starts at</label>
                  <Input type="date" value={createForm.data.starts_at} onChange={(e) => createForm.setData('starts_at', e.target.value)} className={createForm.errors.starts_at ? 'border-red-500' : ''} />
                  {createForm.errors.starts_at ? <span className="text-xs text-red-500">{createForm.errors.starts_at}</span> : null}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300">Ends at</label>
                  <Input type="date" value={createForm.data.ends_at} onChange={(e) => createForm.setData('ends_at', e.target.value)} className={createForm.errors.ends_at ? 'border-red-500' : ''} />
                  {createForm.errors.ends_at ? <span className="text-xs text-red-500">{createForm.errors.ends_at}</span> : null}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300">Payment method</label>
                  <Input value={createForm.data.payment_method} onChange={(e) => createForm.setData('payment_method', e.target.value)} className={createForm.errors.payment_method ? 'border-red-500' : ''} />
                  {createForm.errors.payment_method ? <span className="text-xs text-red-500">{createForm.errors.payment_method}</span> : null}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300">Status</label>
                  <select value={createForm.data.status} onChange={(e) => createForm.setData('status', e.target.value)} className={`h-10 w-full rounded-md border px-3 text-sm ${createForm.errors.status ? 'border-red-500' : 'border-slate-200 dark:border-slate-800 dark:border-slate-800'}`}>
                    <option value="active">Active</option>
                    <option value="trialing">Trialing</option>
                    <option value="paused">Paused</option>
                  </select>
                  {createForm.errors.status ? <span className="text-xs text-red-500">{createForm.errors.status}</span> : null}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createForm.processing}>{createForm.processing ? 'Creating...' : 'Create subscription'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
