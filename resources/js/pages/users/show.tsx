import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  CreditCard,
  Edit3,
  Minus,
  Pause,
  Play,
  Plus,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { Upload } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import type {FormEvent, DragEvent} from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

// ── Types ──────────────────────────────────────────────

type User = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  name: string;
  email: string;
  username: string | null;
  country_name: string | null;
  state: string | null;
  city: string | null;
  zip_code: string | null;
  avatar: string | null;
  status: string | null;
  email_verified_at: string | null;
  subscriptions_count: number;
  payments_count: number;
  created_at: string;
  updated_at: string;
};

type Plan = {
  id: number;
  name: string;
  slug: string;
  final_price?: string | number;
  currency?: string;
  billing_interval?: string;
};

type Subscription = {
  id: number;
  plan: Plan | null;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'paused';
  payment_method: string;
  starts_at: string | null;
  ends_at: string | null;
  trial_ends_at: string | null;
  cancelled_at: string | null;
  provider_subscription_id: string | null;
  created_at: string;
};

type Payment = {
  id: number;
  plan: Plan | null;
  subscription: { id: number; status: string; provider_subscription_id: string | null } | null;
  amount: string | number;
  currency: string;
  payment_method: string;
  transaction_id: string;
  status: string;
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

type PageProps = {
  user: User;
  subscriptions: Subscription[];
  payments: PaginatedResponse<Payment>;
  plans: Plan[];
  flash?: {
    success?: string;
    error?: string;
  };
};

// ── Helpers ──────────────────────────────────────────────

const subStatusStyles: Record<string, string> = {
  active: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
  trialing: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
  past_due: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20',
  canceled: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800',
  paused: 'bg-blue-50 text-blue-700 border-blue-200',
};

const paymentStatusStyles: Record<string, string> = {
  completed: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
  pending: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
  failed: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20',
  refunded: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800',
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) {
return '—';
}

  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateString));
};

const formatDateTime = (dateString: string | null): string => {
  if (!dateString) {
return '—';
}

  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(dateString));
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

// ── Component ──────────────────────────────────────────────

export default function UsersShow() {
  const { user, subscriptions, payments, plans, flash } = usePage<PageProps>().props;
  const [dismissedSuccess, setDismissedSuccess] = useState<string | null>(null);
  const showSuccess = Boolean(flash?.success) && flash?.success !== dismissedSuccess;
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'transactions'>('subscriptions');

  // Sub action dialogs
  const [actionTarget, setActionTarget] = useState<Subscription | null>(null);
  const [dialogType, setDialogType] = useState<'cancel' | 'pause' | 'reactivate' | 'extend' | 'reduce' | 'createSub' | null>(null);

  // Edit dialog
  const [isEditOpen, setIsEditOpen] = useState(false);
  const editForm = useForm({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email,
    password: '',
    status: user.status || 'active',
    is_verified: user.email_verified_at ? '1' : '0',
    avatar: null as File | null,
    remove_avatar: false,
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleAvatarFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
return;
}

    editForm.setData('avatar', file);
    editForm.setData('remove_avatar', false);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, [editForm]);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];

    if (file) {
handleAvatarFile(file);
}
  }, [handleAvatarFile]);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const clearAvatar = () => {
    editForm.setData('avatar', null);
    setAvatarPreview(null);
  };

  // Delete dialogs
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'soft' | 'permanent'>('soft');

  // Create transaction dialog
  const [isTxnOpen, setIsTxnOpen] = useState(false);
  const txnForm = useForm({
    user_id: String(user.id),
    plan_id: '',
    amount: '',
    currency: 'USD',
    payment_method: 'manual',
    status: 'completed',
  });

  const daysForm = useForm({ days: '30' });
  const createForm = useForm({
    user_id: String(user.id),
    plan_id: '',
    payment_method: 'manual',
    starts_at: new Date().toISOString().split('T')[0],
    ends_at: new Date(new Date().getTime() + 30 * 86400000).toISOString().split('T')[0],
    status: 'active',
    create_transaction: false,
    txn_amount: '',
    txn_currency: 'USD',
    txn_status: 'completed',
  });  const openDialog = (type: typeof dialogType, sub?: Subscription) => {
    setDialogType(type);

    if (sub) {
setActionTarget(sub);
}

    if (type === 'extend' || type === 'reduce') {
      daysForm.setData('days', '30');
      daysForm.clearErrors();
    }

    if (type === 'createSub') {
      createForm.setData({
        user_id: String(user.id), plan_id: '', payment_method: 'manual',
        starts_at: new Date().toISOString().split('T')[0],
        ends_at: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        status: 'active', create_transaction: false, txn_amount: '', txn_currency: 'USD', txn_status: 'completed',
      });
      createForm.clearErrors();
    }
  };

  const closeDialog = () => {
 setDialogType(null); setActionTarget(null); 
};

  const confirmSimpleAction = (action: string) => {
    if (!actionTarget) {
return;
}

    router.post(`/subscriptions/${actionTarget.id}/${action}`, {}, { preserveScroll: true, onSuccess: closeDialog });
  };

  const submitDaysAction = (event: FormEvent<HTMLFormElement>, action: string) => {
    event.preventDefault();

    if (!actionTarget) {
return;
}

    daysForm.post(`/subscriptions/${actionTarget.id}/${action}`, { preserveScroll: true, onSuccess: closeDialog });
  };

  const submitCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createForm.post('/subscriptions', {
      preserveScroll: true,
      onSuccess: () => {
        // If also creating a transaction, post that too
        if (createForm.data.create_transaction && createForm.data.txn_amount) {
          txnForm.setData({
            user_id: String(user.id),
            plan_id: createForm.data.plan_id,
            amount: createForm.data.txn_amount,
            currency: createForm.data.txn_currency,
            payment_method: createForm.data.payment_method,
            status: createForm.data.txn_status,
          });
          // Small delay to ensure sub is created first
          setTimeout(() => {
            router.post('/transactions', {
              user_id: user.id,
              plan_id: createForm.data.plan_id,
              amount: createForm.data.txn_amount,
              currency: createForm.data.txn_currency,
              payment_method: createForm.data.payment_method,
              status: createForm.data.txn_status,
            }, { preserveScroll: true });
          }, 200);
        }

        closeDialog();
      },
    });
  };

  const submitEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('_method', 'PATCH');

    if (editForm.data.first_name) {
formData.append('first_name', editForm.data.first_name);
}

    if (editForm.data.last_name) {
formData.append('last_name', editForm.data.last_name);
}

    if (editForm.data.email) {
formData.append('email', editForm.data.email);
}

    if (editForm.data.password) {
formData.append('password', editForm.data.password);
}

    formData.append('status', editForm.data.status);
    formData.append('is_verified', editForm.data.is_verified);

    if (editForm.data.avatar) {
formData.append('avatar', editForm.data.avatar);
}

    if (editForm.data.remove_avatar) {
formData.append('remove_avatar', '1');
}

    router.post(`/users/${user.username}`, formData, {
      preserveScroll: true,
      onSuccess: () => setIsEditOpen(false),
    });
  };

  const submitDelete = () => {
    if (deleteType === 'soft') {
      router.post(`/users/${user.username}/soft-delete`, {}, { preserveScroll: true });
    } else {
      router.delete(`/users/${user.username}`, { preserveScroll: true });
    }
  };

  const submitTxn = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    txnForm.post('/transactions', { preserveScroll: true, onSuccess: () => {
 txnForm.reset(); setIsTxnOpen(false); 
} });
  };

  const activeSubscription = subscriptions.find((s) => s.status === 'active' || s.status === 'trialing');

  return (
    <AdminLayout title={`${user.name}`}>
      <Head title={`${user.name} - User Details`} />

      <div className="space-y-8">


        {/* Flash */}
        {flash?.success && showSuccess ? (
          <div className="flex items-start justify-between gap-3 rounded-md border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
            <span>{flash.success}</span>
            <button type="button" onClick={() => setDismissedSuccess(flash?.success ?? null)} className="rounded p-1 text-emerald-700 dark:text-emerald-400/80 transition hover:text-emerald-900" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        {/* ── Profile Banner ── */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-amber-200/60 dark:bg-amber-500/10 blur-3xl" />
          <div className="absolute -left-24 -bottom-24 h-48 w-48 rounded-full bg-sky-200/70 dark:bg-sky-500/10 blur-3xl" />
          <div className="relative space-y-4">
            <Link href="/users" className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to users
            </Link>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              {/* Left: Avatar + info */}
              <div className="flex items-center gap-4">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="h-16 w-16 rounded-2xl object-cover ring-1 ring-slate-200 dark:ring-slate-800" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold text-2xl">
                    {user.first_name?.[0] || user.email[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">User profile</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{user.name}</h1>
                    <Badge variant="outline" className={user.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : user.status === 'deleted' ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'}>
                      {user.status || 'unknown'}
                    </Badge>
                    {user.email_verified_at ? (
                      <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-500 text-xs font-medium bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-500/20">
                        <XCircle className="h-3.5 w-3.5" /> Unverified
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">{user.email}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Joined {formatDate(user.created_at)}{user.username ? ` · @${user.username}` : ''}</p>
                  {(user.country_name || user.city || user.state) ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      📍 {[user.city, user.state, user.country_name].filter(Boolean).join(', ')} {user.zip_code ? `(${user.zip_code})` : ''}
                    </p>
                  ) : null}
                </div>
              </div>
              {/* Right: actions + stats */}
              <div className="flex flex-wrap gap-3">
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => {
 editForm.setData({ first_name: user.first_name || '', last_name: user.last_name || '', email: user.email, password: '', status: user.status || 'active', is_verified: user.email_verified_at ? '1' : '0', avatar: null, remove_avatar: false }); editForm.clearErrors(); setIsEditOpen(true);
}}>
                  <Edit3 className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 text-red-600 border-red-200 dark:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-500/10" onClick={() => {
 setDeleteType('soft'); setIsDeleteOpen(true);
}}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Active Subscription Control ── */}
        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-indigo-500" /> Subscription Control
              </CardTitle>
              <CardDescription>Manage the user's active subscription or create a new one.</CardDescription>
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => openDialog('createSub')}>
              <Plus className="h-3.5 w-3.5" /> Manual Subscription
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            {activeSubscription ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 dark:text-white">{activeSubscription.plan?.name ?? 'Unknown Plan'}</p>
                      <Badge variant="outline" className={`capitalize ${subStatusStyles[activeSubscription.status]}`}>{activeSubscription.status}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(activeSubscription.starts_at)} → {activeSubscription.plan?.billing_interval === 'lifetime' ? 'Lifetime' : formatDate(activeSubscription.ends_at)} · {activeSubscription.payment_method}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeSubscription.plan?.billing_interval !== 'lifetime' && (
                      <>
                        <Button size="sm" variant="outline" className="gap-1.5 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 hover:bg-amber-50 dark:bg-amber-500/10" onClick={() => openDialog('extend', activeSubscription)}>
                          <Calendar className="h-3.5 w-3.5" /> Extend
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1.5 text-orange-700 border-orange-200 hover:bg-orange-50" onClick={() => openDialog('reduce', activeSubscription)}>
                          <Minus className="h-3.5 w-3.5" /> Reduce
                        </Button>
                      </>
                    )}
                    {activeSubscription.status === 'active' || activeSubscription.status === 'trialing' ? (
                      <Button size="sm" variant="outline" className="gap-1.5 text-blue-700 border-blue-200 hover:bg-blue-50" onClick={() => openDialog('pause', activeSubscription)}>
                        <Pause className="h-3.5 w-3.5" /> Pause
                      </Button>
                    ) : null}
                    {activeSubscription.status === 'paused' ? (
                      <Button size="sm" variant="outline" className="gap-1.5 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-50 dark:bg-emerald-500/10" onClick={() => openDialog('reactivate', activeSubscription)}>
                        <Play className="h-3.5 w-3.5" /> Reactivate
                      </Button>
                    ) : null}
                    <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => openDialog('cancel', activeSubscription)}>
                      <X className="h-3.5 w-3.5" /> Revoke
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                No active subscription. Use "Manual Subscription" to create one.
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Tab Navigation ── */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-fit">
          <button type="button" onClick={() => setActiveTab('subscriptions')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'subscriptions' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white'}`}>
            Subscription History ({subscriptions.length})
          </button>
          <button type="button" onClick={() => setActiveTab('transactions')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'transactions' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white'}`}>
            Transactions ({payments.data.length})
          </button>
        </div>

        {/* ── Subscription History Tab ── */}
        {activeTab === 'subscriptions' ? (
          <Card className="shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 pb-4"><CardTitle className="text-base">Subscription History</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-4 text-left font-medium">Plan</th>
                      <th className="px-6 py-4 text-left font-medium">Status</th>
                      <th className="px-6 py-4 text-left font-medium">Method</th>
                      <th className="px-6 py-4 text-left font-medium">Started</th>
                      <th className="px-6 py-4 text-left font-medium">Ends</th>
                      <th className="px-6 py-4 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white dark:bg-slate-900">
                    {subscriptions.length > 0 ? (
                      subscriptions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/25 dark:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{sub.plan?.name ?? '—'}</td>
                          <td className="px-6 py-4"><Badge variant="outline" className={`capitalize ${subStatusStyles[sub.status] ?? ''}`}>{sub.status}</Badge></td>
                          <td className="px-6 py-4"><span className="capitalize text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-medium">{sub.payment_method}</span></td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{formatDate(sub.starts_at)}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                            {sub.plan?.billing_interval === 'lifetime' ? (
                              <span className="font-semibold text-violet-600 bg-violet-50 dark:bg-violet-500/10 border border-violet-100 px-2 py-0.5 rounded text-xs">
                                Lifetime
                              </span>
                            ) : formatDate(sub.ends_at)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="gap-1" asChild><Link href={`/subscriptions/${sub.id}`}>View</Link></Button>
                              {sub.status === 'canceled' ? (
                                <Button size="sm" variant="outline" className="gap-1 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-50 dark:bg-emerald-500/10" onClick={() => openDialog('reactivate', sub)}>
                                  <Play className="h-3 w-3" /> Reactivate
                                </Button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">No subscriptions found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* ── Transactions Tab ── */}
        {activeTab === 'transactions' ? (
          <Card className="shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Transaction History</CardTitle>
              <Button size="sm" className="gap-1.5" onClick={() => {
 txnForm.setData({ user_id: String(user.id), plan_id: '', amount: '', currency: 'USD', payment_method: 'manual', status: 'completed' }); txnForm.clearErrors(); setIsTxnOpen(true); 
}}>
                <Plus className="h-3.5 w-3.5" /> Record Transaction
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-4 text-left font-medium">Transaction ID</th>
                      <th className="px-6 py-4 text-left font-medium">Plan</th>
                      <th className="px-6 py-4 text-left font-medium">Amount</th>
                      <th className="px-6 py-4 text-left font-medium">Status</th>
                      <th className="px-6 py-4 text-left font-medium">Method</th>
                      <th className="px-6 py-4 text-left font-medium">Date</th>
                      <th className="px-6 py-4 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white dark:bg-slate-900">
                    {payments.data.length > 0 ? (
                      payments.data.map((payment) => (
                        <tr key={payment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/25 dark:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4"><span className="font-mono text-xs text-slate-700 dark:text-slate-300">{payment.transaction_id}</span></td>
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{payment.plan?.name ?? '—'}</td>
                          <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{formatPrice(payment.amount, payment.currency)}</td>
                          <td className="px-6 py-4"><Badge variant="outline" className={`capitalize ${paymentStatusStyles[payment.status] ?? ''}`}>{payment.status}</Badge></td>
                          <td className="px-6 py-4"><span className="capitalize text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-medium">{payment.payment_method}</span></td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{formatDateTime(payment.created_at)}</td>
                          <td className="px-6 py-4"><Button size="sm" variant="outline" asChild><Link href={`/transactions/${payment.id}`}>View</Link></Button></td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">No transactions found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {payments.links && payments.links.length > 0 ? (
                <div className="flex flex-wrap items-center justify-center gap-1 p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  {payments.links.map((link, index) =>
                    link.url ? (
                      <Link key={index} href={link.url} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${link.active ? 'bg-indigo-600 text-white font-medium shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                    ) : (
                      <span key={index} className="px-3 py-1.5 text-sm rounded-md text-slate-400 bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed" dangerouslySetInnerHTML={{ __html: link.label }} />
                    ),
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {/* ── Cancel Dialog ── */}
        <Dialog open={dialogType === 'cancel'} onOpenChange={(open) => {
 if (!open) {
closeDialog();
} 
}}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Revoke subscription</DialogTitle><DialogDescription>Cancel immediately. The user will lose access.</DialogDescription></DialogHeader>
            <div className="rounded-lg border border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-900/20 px-4 py-3 text-sm text-rose-900 dark:text-rose-400"><p className="font-medium">{actionTarget?.plan?.name ?? 'Unknown Plan'}</p></div>
            <DialogFooter><Button variant="outline" onClick={closeDialog}>Keep active</Button><Button variant="destructive" onClick={() => confirmSimpleAction('cancel')}>Revoke</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Pause Dialog ── */}
        <Dialog open={dialogType === 'pause'} onOpenChange={(open) => {
 if (!open) {
closeDialog();
} 
}}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Pause subscription</DialogTitle><DialogDescription>Temporarily pause. Won't auto-renew.</DialogDescription></DialogHeader>
            <DialogFooter><Button variant="outline" onClick={closeDialog}>Cancel</Button><Button onClick={() => confirmSimpleAction('pause')}>Pause subscription</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Reactivate Dialog ── */}
        <Dialog open={dialogType === 'reactivate'} onOpenChange={(open) => {
 if (!open) {
closeDialog();
} 
}}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Reactivate subscription</DialogTitle><DialogDescription>Restore access and set status back to active.</DialogDescription></DialogHeader>
            <DialogFooter><Button variant="outline" onClick={closeDialog}>Cancel</Button><Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => confirmSimpleAction('reactivate')}>Reactivate</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Extend Dialog ── */}
        <Dialog open={dialogType === 'extend'} onOpenChange={(open) => {
 if (!open) {
closeDialog();
} 
}}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Extend subscription</DialogTitle><DialogDescription>Add days to the end date.</DialogDescription></DialogHeader>
            <form onSubmit={(e) => submitDaysAction(e, 'extend')} className="space-y-4">
              <div className="rounded-lg border border-indigo-100 bg-indigo-50 dark:border-indigo-500/20 dark:bg-indigo-500/10 px-4 py-3 text-sm"><p className="text-xs text-indigo-700 dark:text-indigo-400">Current end: {formatDate(actionTarget?.ends_at ?? null)}</p></div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Days to add</label>
                <Input type="number" min="1" max="365" value={daysForm.data.days} onChange={(e) => daysForm.setData('days', e.target.value)} className={daysForm.errors.days ? 'border-red-500' : ''} />
                {daysForm.errors.days ? <span className="text-xs text-red-500">{daysForm.errors.days}</span> : null}
              </div>
              <DialogFooter><Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button><Button type="submit" disabled={daysForm.processing}>{daysForm.processing ? 'Extending...' : 'Extend'}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Reduce Dialog ── */}
        <Dialog open={dialogType === 'reduce'} onOpenChange={(open) => {
 if (!open) {
closeDialog();
} 
}}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Reduce subscription days</DialogTitle><DialogDescription>Subtract days from the end date.</DialogDescription></DialogHeader>
            <form onSubmit={(e) => submitDaysAction(e, 'reduce')} className="space-y-4">
              <div className="rounded-lg border border-orange-100 bg-orange-50 dark:border-orange-500/20 dark:bg-orange-500/10 px-4 py-3 text-sm"><p className="text-xs text-orange-700 dark:text-orange-400">Current end: {formatDate(actionTarget?.ends_at ?? null)}</p></div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Days to subtract</label>
                <Input type="number" min="1" max="365" value={daysForm.data.days} onChange={(e) => daysForm.setData('days', e.target.value)} className={daysForm.errors.days ? 'border-red-500' : ''} />
                {daysForm.errors.days ? <span className="text-xs text-red-500">{daysForm.errors.days}</span> : null}
              </div>
              <DialogFooter><Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button><Button type="submit" variant="destructive" disabled={daysForm.processing}>{daysForm.processing ? 'Reducing...' : 'Reduce days'}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Create Manual Subscription Dialog ── */}
        <Dialog open={dialogType === 'createSub'} onOpenChange={(open) => {
 if (!open) {
closeDialog();
} 
}}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Create manual subscription</DialogTitle><DialogDescription>Manually assign a subscription plan to {user.name}.</DialogDescription></DialogHeader>
            <form onSubmit={submitCreate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Plan</label>
                <select value={createForm.data.plan_id} onChange={(e) => createForm.setData('plan_id', e.target.value)} className={`h-10 w-full rounded-md border bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 text-sm ${createForm.errors.plan_id ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'}`}>
                  <option value="" className="bg-white dark:bg-slate-900">Select a plan</option>
                  {plans.map((plan) => (<option key={plan.id} value={plan.id} className="bg-white dark:bg-slate-900">{plan.name}</option>))}
                </select>
                {createForm.errors.plan_id ? <span className="text-xs text-red-500">{createForm.errors.plan_id}</span> : null}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Starts at</label>
                  <Input type="date" value={createForm.data.starts_at} onChange={(e) => createForm.setData('starts_at', e.target.value)} className={createForm.errors.starts_at ? 'border-red-500' : ''} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ends at</label>
                  <Input type="date" value={createForm.data.ends_at} onChange={(e) => createForm.setData('ends_at', e.target.value)} className={createForm.errors.ends_at ? 'border-red-500' : ''} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Payment method</label>
                  <Input value={createForm.data.payment_method} onChange={(e) => createForm.setData('payment_method', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                  <select value={createForm.data.status} onChange={(e) => createForm.setData('status', e.target.value)} className="h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 text-sm">
                    <option value="active" className="bg-white dark:bg-slate-900">Active</option>
                    <option value="trialing" className="bg-white dark:bg-slate-900">Trialing</option>
                    <option value="paused" className="bg-white dark:bg-slate-900">Paused</option>
                  </select>
                </div>
              </div>

              {/* Optional: Also create a transaction */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={createForm.data.create_transaction} onChange={(e) => createForm.setData('create_transaction', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Also record a transaction</span>
                </label>
                {createForm.data.create_transaction ? (
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Amount</label>
                      <Input type="number" step="0.01" min="0" value={createForm.data.txn_amount} onChange={(e) => createForm.setData('txn_amount', e.target.value)} placeholder="0.00" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Currency</label>
                      <Input value={createForm.data.txn_currency} onChange={(e) => createForm.setData('txn_currency', e.target.value)} maxLength={3} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Txn status</label>
                      <select value={createForm.data.txn_status} onChange={(e) => createForm.setData('txn_status', e.target.value)} className="h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 text-xs">
                        <option value="completed" className="bg-white dark:bg-slate-900">Completed</option>
                        <option value="pending" className="bg-white dark:bg-slate-900">Pending</option>
                      </select>
                    </div>
                  </div>
                ) : null}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                <Button type="submit" disabled={createForm.processing}>{createForm.processing ? 'Creating...' : 'Create subscription'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Edit User Dialog ── */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Edit user</DialogTitle><DialogDescription>Update profile details for {user.name}.</DialogDescription></DialogHeader>
            <form onSubmit={submitEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">First name</label>
                  <Input value={editForm.data.first_name} onChange={(e) => editForm.setData('first_name', e.target.value)} />
                  {editForm.errors.first_name ? <span className="text-xs text-red-500">{editForm.errors.first_name}</span> : null}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Last name</label>
                  <Input value={editForm.data.last_name} onChange={(e) => editForm.setData('last_name', e.target.value)} />
                  {editForm.errors.last_name ? <span className="text-xs text-red-500">{editForm.errors.last_name}</span> : null}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                <Input type="email" value={editForm.data.email} onChange={(e) => editForm.setData('email', e.target.value)} />
                {editForm.errors.email ? <span className="text-xs text-red-500">{editForm.errors.email}</span> : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">New password <span className="text-slate-400 font-normal">(leave blank to keep current)</span></label>
                <Input type="password" value={editForm.data.password} onChange={(e) => editForm.setData('password', e.target.value)} placeholder="••••••••" />
                {editForm.errors.password ? <span className="text-xs text-red-500">{editForm.errors.password}</span> : null}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                  <select value={editForm.data.status} onChange={(e) => editForm.setData('status', e.target.value)} className="h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 text-sm">
                    <option value="active" className="bg-white dark:bg-slate-900">Active</option>
                    <option value="inactive" className="bg-white dark:bg-slate-900">Inactive</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Verification</label>
                  <select value={editForm.data.is_verified} onChange={(e) => editForm.setData('is_verified', e.target.value)} className="h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 text-sm">
                    <option value="1" className="bg-white dark:bg-slate-900">Verified</option>
                    <option value="0" className="bg-white dark:bg-slate-900">Unverified</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Avatar</label>
                <div
                  ref={dropRef}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`relative rounded-xl border-2 border-dashed transition-all duration-300 ${
                    isDragging
                      ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-500/20 scale-[1.02] shadow-lg shadow-indigo-100'
                      : avatarPreview
                        ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-500/10'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-indigo-300 hover:bg-indigo-50 hover:dark:bg-indigo-500/10'
                  }`}
                >
                  {avatarPreview ? (
                    <div className="flex items-center gap-4 p-4">
                      <div className="relative">
                        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 opacity-30 animate-pulse" />
                        <img src={avatarPreview} alt="Preview" className="relative h-16 w-16 rounded-full object-cover border-2 border-white shadow-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{editForm.data.avatar?.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{editForm.data.avatar ? `${(editForm.data.avatar.size / 1024).toFixed(1)} KB` : ''}</p>
                      </div>
                      <button type="button" onClick={clearAvatar} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:bg-red-500/10 transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center gap-3 p-6 cursor-pointer">
                      <div className={`p-3 rounded-xl transition-all duration-300 ${isDragging ? 'bg-indigo-100 dark:bg-indigo-900/50 scale-110' : 'bg-slate-100 dark:bg-slate-800'}`}>
                        <Upload className={`h-6 w-6 transition-colors ${isDragging ? 'text-indigo-600' : 'text-slate-400'}`} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {isDragging ? 'Drop image here' : 'Drag & drop avatar'}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">or <span className="text-indigo-600 font-medium hover:text-indigo-700 dark:text-indigo-400">click to browse</span></p>
                        <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, WEBP up to 2MB</p>
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
 const f = e.target.files?.[0];

 if (f) {
handleAvatarFile(f);
} 
}} />
                    </label>
                  )}
                </div>
                {user.avatar && !avatarPreview ? (
                  <label className="flex items-center gap-2 cursor-pointer mt-2">
                    <input type="checkbox" checked={editForm.data.remove_avatar} onChange={(e) => editForm.setData('remove_avatar', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500" />
                    <span className="text-xs text-red-600">Remove current avatar</span>
                  </label>
                ) : null}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Delete User Dialog ── */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Delete user</DialogTitle><DialogDescription>Choose how to remove {user.name}.</DialogDescription></DialogHeader>
            <div className="space-y-3">
              <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${deleteType === 'soft' ? 'border-amber-300 bg-amber-50 dark:bg-amber-500/10' : 'border-slate-200 dark:border-slate-800'}`}>
                <input type="radio" name="deleteType" value="soft" checked={deleteType === 'soft'} onChange={() => setDeleteType('soft')} className="mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Deactivate (soft delete)</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Marks user as "deleted". Data is preserved and can be restored.</p>
                </div>
              </label>
              <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${deleteType === 'permanent' ? 'border-red-300 bg-red-50 dark:bg-red-500/10' : 'border-slate-200 dark:border-slate-800'}`}>
                <input type="radio" name="deleteType" value="permanent" checked={deleteType === 'permanent'} onChange={() => setDeleteType('permanent')} className="mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">Permanent delete</p>
                  <p className="text-xs text-red-500">Completely removes the user and all associated data. This cannot be undone.</p>
                </div>
              </label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={submitDelete}>{deleteType === 'soft' ? 'Deactivate' : 'Delete permanently'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Record Transaction Dialog ── */}
        <Dialog open={isTxnOpen} onOpenChange={setIsTxnOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Record transaction</DialogTitle><DialogDescription>Record a manual payment for {user.name}.</DialogDescription></DialogHeader>
            <form onSubmit={submitTxn} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Plan</label>
                <select value={txnForm.data.plan_id} onChange={(e) => txnForm.setData('plan_id', e.target.value)} className={`h-10 w-full rounded-md border bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 text-sm ${txnForm.errors.plan_id ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'}`}>
                  <option value="" className="bg-white dark:bg-slate-900">Select a plan</option>
                  {plans.map((p) => <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900">{p.name}</option>)}
                </select>
                {txnForm.errors.plan_id ? <span className="text-xs text-red-500">{txnForm.errors.plan_id}</span> : null}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Amount</label>
                  <Input type="number" step="0.01" min="0" value={txnForm.data.amount} onChange={(e) => txnForm.setData('amount', e.target.value)} placeholder="0.00" className={txnForm.errors.amount ? 'border-red-500' : ''} />
                  {txnForm.errors.amount ? <span className="text-xs text-red-500">{txnForm.errors.amount}</span> : null}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Currency</label>
                  <Input value={txnForm.data.currency} onChange={(e) => txnForm.setData('currency', e.target.value)} maxLength={3} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Payment method</label>
                  <Input value={txnForm.data.payment_method} onChange={(e) => txnForm.setData('payment_method', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                  <select value={txnForm.data.status} onChange={(e) => txnForm.setData('status', e.target.value)} className="h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 text-sm">
                    <option value="completed" className="bg-white dark:bg-slate-900">Completed</option>
                    <option value="pending" className="bg-white dark:bg-slate-900">Pending</option>
                    <option value="failed" className="bg-white dark:bg-slate-900">Failed</option>
                    <option value="refunded" className="bg-white dark:bg-slate-900">Refunded</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsTxnOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={txnForm.processing}>{txnForm.processing ? 'Recording...' : 'Record transaction'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
