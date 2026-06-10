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
import { Eye, Plus, Search, X } from 'lucide-react';
import {  useState, useRef } from 'react';
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
};

type SubscriptionRef = {
  id: number;
  status: string;
  provider_subscription_id: string | null;
};

type Transaction = {
  id: number;
  user: User;
  plan: Plan | null;
  subscription: SubscriptionRef | null;
  amount: string | number;
  currency: string;
  payment_method: string;
  transaction_id: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
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
  transactions?: PaginatedResponse<Transaction>;
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
  completed: 'bg-emerald-50 dark:bg-emerald-500/10 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 dark:border-emerald-500/20',
  pending: 'bg-amber-50 dark:bg-amber-500/10 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 dark:border-amber-500/20',
  failed: 'bg-red-50 dark:bg-red-500/10 dark:bg-red-500/10 text-red-700 dark:text-red-400 dark:text-red-400 border-red-200 dark:border-red-500/20 dark:border-red-500/20',
  refunded: 'bg-slate-100 dark:bg-slate-800 dark:bg-slate-800 text-slate-600 dark:text-slate-300 dark:text-slate-300 border-slate-200 dark:border-slate-800 dark:border-slate-800',
};

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

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

export default function TransactionsIndex() {
  const { transactions, plans, filters, flash } = usePage<PageProps>().props;
  const [searchValue, setSearchValue] = useState(filters.search ?? '');
  const [statusValue, setStatusValue] = useState(filters.status ?? '');
  const [dismissedSuccess, setDismissedSuccess] = useState<string | null>(null);
  const showSuccess = Boolean(flash?.success) && flash?.success !== dismissedSuccess;

  // Create transaction dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const createForm = useForm({
    user_id: '',
    plan_id: '',
    amount: '',
    currency: 'USD',
    payment_method: 'manual',
    status: 'completed',
  });

  // User search
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const userSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchUsersForTxn = (query: string) => {
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

  const submitCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createForm.post('/transactions', {
      preserveScroll: true,
      onSuccess: () => {
        createForm.reset();
        setSelectedUser(null);
        setIsCreateOpen(false);
      },
    });
  };


  const applyFilters = () => {
    router.get(
      '/transactions',
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
    router.get('/transactions', {}, { preserveState: true, preserveScroll: true });
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applyFilters();
  };

  const handleStatusChange = (value: string) => {
    setStatusValue(value);
    router.get(
      '/transactions',
      {
        ...(searchValue ? { search: searchValue } : {}),
        ...(value ? { status: value } : {}),
      },
      { preserveState: true, preserveScroll: true },
    );
  };

  return (
    <AdminLayout title="Transactions">
      <Head title="Transactions" />

      <div className="space-y-8">
        {/* Header */}
        <section className="relative overflow-hidden rounded-2xl border bg-white dark:bg-slate-900 dark:bg-slate-900 p-6 shadow-sm">
          <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-emerald-200/60 blur-3xl" />
          <div className="absolute -left-24 -bottom-24 h-48 w-48 rounded-full bg-teal-200/70 blur-3xl" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 dark:text-slate-400">
                Monetization
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white dark:text-white">
                Transactions
              </h1>
              <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300 dark:text-slate-300">
                Track all payment transactions across subscriptions. View payment details and provider payloads.
              </p>
            </div>
            <Button className="gap-2" onClick={() => {
 createForm.clearErrors(); setIsCreateOpen(true); 
}}>
              <Plus className="h-4 w-4" />
              Record Transaction
            </Button>
          </div>
        </section>

        {/* Flash */}
        {flash?.success && showSuccess ? (
          <div className="flex items-start justify-between gap-3 rounded-md border border-emerald-200 dark:border-emerald-500/20 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 dark:bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400 dark:text-emerald-400">
            <span>{flash.success}</span>
            <button type="button" onClick={() => setDismissedSuccess(flash?.success ?? null)} className="rounded p-1 text-emerald-700 dark:text-emerald-400 dark:text-emerald-400/80 transition hover:text-emerald-900" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <form onSubmit={handleSearch} className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search by transaction ID, name, or email..."
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

        {/* Table */}
        <Deferred
          data="transactions"
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
                      <th className="px-4 py-4 text-left">Transaction ID</th>
                      <th className="px-4 py-4 text-left">User</th>
                      <th className="px-4 py-4 text-left">Plan</th>
                      <th className="px-4 py-4 text-left">Amount</th>
                      <th className="px-4 py-4 text-left">Status</th>
                      <th className="px-4 py-4 text-left">Method</th>
                      <th className="px-4 py-4 text-left">Date</th>
                      <th className="px-4 py-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions?.data.length ? (
                      transactions.data.map((txn) => (
                        <tr key={txn.id} className="border-b last:border-b-0 align-top hover:bg-slate-50 dark:hover:bg-slate-800/25 dark:bg-slate-800/50 dark:hover:bg-slate-800/25 dark:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-4">
                            <span className="font-mono text-xs text-slate-700 dark:text-slate-300 dark:text-slate-300">{txn.transaction_id}</span>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              {txn.user.avatar ? (
                                <img src={txn.user.avatar} alt="Avatar" className="h-8 w-8 rounded-full object-cover border border-slate-200 dark:border-slate-800 dark:border-slate-800" />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                                  {txn.user.first_name?.[0] || txn.user.email[0].toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white dark:text-white">{getUserDisplayName(txn.user)}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400">{txn.user.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <p className="font-medium text-slate-900 dark:text-white dark:text-white">{txn.plan?.name ?? '—'}</p>
                          </td>

                          <td className="px-4 py-4">
                            <p className="font-semibold text-slate-900 dark:text-white dark:text-white">{formatPrice(txn.amount, txn.currency)}</p>
                          </td>

                          <td className="px-4 py-4">
                            <Badge variant="outline" className={`capitalize ${statusStyles[txn.status] ?? ''}`}>
                              {txn.status}
                            </Badge>
                          </td>

                          <td className="px-4 py-4">
                            <span className="capitalize text-slate-600 dark:text-slate-300 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 dark:bg-slate-800 px-2 py-1 rounded text-xs font-medium">
                              {txn.payment_method || 'N/A'}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-slate-600 dark:text-slate-300 dark:text-slate-300">
                            {formatDate(txn.created_at)}
                          </td>

                          <td className="px-4 py-4">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="gap-1.5"
                              onClick={() => router.get(`/transactions/${txn.id}`)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400" colSpan={8}>
                          No transactions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {transactions?.links && transactions.links.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2 border-t bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 px-4 py-3 text-sm">
                  {transactions.links.map((link, index) =>
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

        {/* Record Transaction Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Record transaction</DialogTitle>
              <DialogDescription>Manually record a payment transaction.</DialogDescription>
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
                    <Input value={userQuery} onChange={(e) => searchUsersForTxn(e.target.value)} placeholder="Search by name, email, or username..." className={createForm.errors.user_id ? 'border-red-500' : ''} autoComplete="off" />
                    {userSearchLoading ? (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" /></div>
                    ) : null}
                    {userResults.length > 0 ? (
                      <div className="absolute z-50 top-full mt-1 w-full bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 dark:border-slate-800 rounded-lg shadow-lg max-h-48 overflow-auto">
                        {userResults.map((u) => (
                          <button key={u.id} type="button" onClick={() => pickUser(u)} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/25 dark:bg-slate-800/50 dark:hover:bg-slate-800/25 dark:bg-slate-800/50 text-left transition-colors">
                            {u.avatar ? (
                              <img src={u.avatar} alt="" className="h-7 w-7 rounded-full object-cover border" />
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 dark:text-indigo-400 flex items-center justify-center text-[10px] font-bold">{u.first_name?.[0] || u.email[0].toUpperCase()}</div>
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
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300">Amount</label>
                  <Input type="number" step="0.01" min="0" value={createForm.data.amount} onChange={(e) => createForm.setData('amount', e.target.value)} placeholder="0.00" className={createForm.errors.amount ? 'border-red-500' : ''} />
                  {createForm.errors.amount ? <span className="text-xs text-red-500">{createForm.errors.amount}</span> : null}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300">Currency</label>
                  <Input value={createForm.data.currency} onChange={(e) => createForm.setData('currency', e.target.value)} maxLength={3} className={createForm.errors.currency ? 'border-red-500' : ''} />
                  {createForm.errors.currency ? <span className="text-xs text-red-500">{createForm.errors.currency}</span> : null}
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
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                  {createForm.errors.status ? <span className="text-xs text-red-500">{createForm.errors.status}</span> : null}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createForm.processing}>{createForm.processing ? 'Recording...' : 'Record transaction'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
