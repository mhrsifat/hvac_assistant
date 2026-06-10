import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/layouts/AdminLayout';
import { destroy as destroyPlan, store as storePlan, update as updatePlan } from '@/routes/plans';
import { Deferred, Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Eye, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { FormEvent} from 'react';
import { useState } from 'react';

// Added 'slug' to the Plan type
type Plan = {
  id: number;
  name: string;
  slug: string;
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

type PlansPageProps = {
  plans?: PaginatedResponse<Plan>;
  flash?: {
    success?: string;
    error?: string;
  };
};

type PlanFormData = {
  name: string;
  final_price: string;
  currency: string;
  apple_product_id: string;
  google_product_id: string;
  features: string[];
  billing_interval: Plan['billing_interval'];
  trial_days: string;
  is_recommended: boolean;
  status: Plan['status'];
};

const billingIntervalLabels: Record<Plan['billing_interval'], string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
  lifetime: 'Lifetime',
};

const statusLabels: Record<Plan['status'], string> = {
  active: 'Active',
  inactive: 'Inactive',
};

const defaultFormData: PlanFormData = {
  name: '',
  final_price: '',
  currency: 'USD',
  apple_product_id: '',
  google_product_id: '',
  features: [''],
  billing_interval: 'monthly',
  trial_days: '0',
  is_recommended: false,
  status: 'active',
};

const formatPrice = (value: string | number | null | undefined, currency: string): string => {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(Number(value));
  } catch {
    return `${currency} ${Number(value).toFixed(2)}`;
  }
};

export default function PlansIndex() {
  const { plans, flash } = usePage<PlansPageProps>().props;
  const [dismissedSuccess, setDismissedSuccess] = useState<string | null>(null);
  const showSuccess = Boolean(flash?.success) && flash?.success !== dismissedSuccess;
  const [dismissedError, setDismissedError] = useState<string | null>(null);
  const showError = Boolean(flash?.error) && flash?.error !== dismissedError;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);

  const planForm = useForm<PlanFormData>(defaultFormData);

  const fillForm = (plan: Plan | null): void => {
    planForm.setData({
      name: plan?.name ?? '',
      final_price: plan?.final_price?.toString() ?? '',
      currency: plan?.currency ?? 'USD',
      apple_product_id: plan?.apple_product_id ?? '',
      google_product_id: plan?.google_product_id ?? '',
      features: plan?.features?.length ? [...plan.features] : [''],
      billing_interval: plan?.billing_interval ?? 'monthly',
      trial_days: plan?.trial_days?.toString() ?? '0',
      is_recommended: plan?.is_recommended ?? false,
      status: plan?.status ?? 'active',
    });
  };

  const openCreateDialog = (): void => {
    setEditingPlan(null);
    fillForm(null);
    planForm.clearErrors();
    setIsFormOpen(true);
  };

  const openEditDialog = (plan: Plan): void => {
    setEditingPlan(plan);
    fillForm(plan);
    planForm.clearErrors();
    setIsFormOpen(true);
  };

  const closeForm = (): void => {
    setIsFormOpen(false);
    setEditingPlan(null);
    planForm.clearErrors();
    fillForm(null);
  };

  const submitPlan = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const visitOptions = {
      preserveScroll: true,
      onSuccess: () => {
        closeForm();
      },
    };

    if (editingPlan) {
      // Changed to use slug for routing update
      planForm.patch(updatePlan.url(editingPlan.slug), visitOptions);

      return;
    }

    planForm.post(storePlan.url(), visitOptions);
  };

  const openDeleteDialog = (plan: Plan): void => {
    setDeleteTarget(plan);
    setIsDeleteOpen(true);
  };

  const confirmDelete = (): void => {
    if (!deleteTarget) {
      return;
    }

    // Changed to use slug for routing delete
    router.delete(destroyPlan.url(deleteTarget.slug), {
      preserveScroll: true,
      onSuccess: () => {
        setIsDeleteOpen(false);
        setDeleteTarget(null);
      },
    });
  };

  const addFeature = (): void => {
    planForm.setData('features', [...planForm.data.features, '']);
  };

  const removeFeature = (index: number): void => {
    const nextFeatures = planForm.data.features.filter((_, itemIndex) => itemIndex !== index);
    planForm.setData('features', nextFeatures.length ? nextFeatures : ['']);
  };

  const updateFeature = (index: number, value: string): void => {
    const nextFeatures = [...planForm.data.features];
    nextFeatures[index] = value;
    planForm.setData('features', nextFeatures);
  };

  return (
    <AdminLayout title="Plans">
      <Head title="Plans" />

      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-amber-200/60 dark:bg-amber-500/10 blur-3xl" />
          <div className="absolute -left-24 -bottom-24 h-48 w-48 rounded-full bg-sky-200/70 dark:bg-sky-500/10 blur-3xl" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                Monetization
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Plans
              </h1>
              <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                Create pricing tiers, update billing settings, and manage subscription metadata from one place.
              </p>
            </div>

            <Dialog open={isFormOpen} onOpenChange={(open) => (open ? setIsFormOpen(true) : closeForm())}>
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={openCreateDialog}>
                  <Plus className="h-4 w-4" />
                  Create plan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{editingPlan ? 'Edit plan' : 'Create a new plan'}</DialogTitle>
                  <DialogDescription>
                    Fill in pricing, billing, and provider identifiers for this plan.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={submitPlan} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Plan name</label>
                      <Input
                        value={planForm.data.name}
                        onChange={(event) => planForm.setData('name', event.target.value)}
                        placeholder="Starter, Pro, Enterprise"
                        className={planForm.errors.name ? 'border-red-500' : ''}
                      />
                      {planForm.errors.name ? <span className="text-xs text-red-500">{planForm.errors.name}</span> : null}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Final price</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={planForm.data.final_price}
                        onChange={(event) => planForm.setData('final_price', event.target.value)}
                        placeholder="19.99"
                        className={planForm.errors.final_price ? 'border-red-500' : ''}
                      />
                      {planForm.errors.final_price ? <span className="text-xs text-red-500">{planForm.errors.final_price}</span> : null}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Currency</label>
                      <Input
                        value={planForm.data.currency}
                        onChange={(event) => planForm.setData('currency', event.target.value.toUpperCase())}
                        placeholder="USD"
                        maxLength={3}
                        className={planForm.errors.currency ? 'border-red-500' : ''}
                      />
                      {planForm.errors.currency ? <span className="text-xs text-red-500">{planForm.errors.currency}</span> : null}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Billing interval</label>
                      <select
                        value={planForm.data.billing_interval}
                        onChange={(event) => planForm.setData('billing_interval', event.target.value as Plan['billing_interval'])}
                        className={`h-10 w-full rounded-md border bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-white ${planForm.errors.billing_interval ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'}`}
                      >
                        {Object.entries(billingIntervalLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      {planForm.errors.billing_interval ? <span className="text-xs text-red-500">{planForm.errors.billing_interval}</span> : null}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Trial days</label>
                      <Input
                        type="number"
                        min="0"
                        value={planForm.data.trial_days}
                        onChange={(event) => planForm.setData('trial_days', event.target.value)}
                        placeholder="0"
                        className={planForm.errors.trial_days ? 'border-red-500' : ''}
                      />
                      {planForm.errors.trial_days ? <span className="text-xs text-red-500">{planForm.errors.trial_days}</span> : null}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                      <select
                        value={planForm.data.status}
                        onChange={(event) => planForm.setData('status', event.target.value as Plan['status'])}
                        className={`h-10 w-full rounded-md border bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-white ${planForm.errors.status ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'}`}
                      >
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      {planForm.errors.status ? <span className="text-xs text-red-500">{planForm.errors.status}</span> : null}
                    </div>

                    <div className="space-y-3 md:col-span-2">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Features</label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Add plan features.</p>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={addFeature} className="gap-2">
                          <Plus className="h-4 w-4" />
                          Add feature
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {planForm.data.features.map((feature, index) => (
                          <div key={index} className="grid gap-2 grid-cols-[1fr_40px]">
                            <Input
                              value={feature}
                              onChange={(event) => updateFeature(index, event.target.value)}
                              placeholder="e.g. Priority Support"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFeature(index)}
                              className="h-10 w-10 text-slate-500 hover:text-red-500"
                              aria-label="Remove feature"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Apple product ID</label>
                      <Input
                        value={planForm.data.apple_product_id}
                        onChange={(event) => planForm.setData('apple_product_id', event.target.value)}
                        placeholder="com.example.plan.pro.ios"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Google product ID</label>
                      <Input
                        value={planForm.data.google_product_id}
                        onChange={(event) => planForm.setData('google_product_id', event.target.value)}
                        placeholder="pro_monthly_android"
                      />
                    </div>

                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={planForm.data.is_recommended}
                        onChange={(event) => planForm.setData('is_recommended', event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      Recommended plan
                    </label>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={closeForm}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={planForm.processing}>
                      {planForm.processing ? (editingPlan ? 'Updating...' : 'Creating...') : editingPlan ? 'Update plan' : 'Create plan'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </section>

        {flash?.success && showSuccess ? (
          <div className="flex items-start justify-between gap-3 rounded-md border border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
            <span>{flash.success}</span>
            <button
              type="button"
              onClick={() => setDismissedSuccess(flash?.success ?? null)}
              className="rounded p-1 text-emerald-700/80 transition hover:text-emerald-900"
              aria-label="Dismiss success message"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        {flash?.error && showError ? (
          <div className="flex items-start justify-between gap-3 rounded-md border border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400">
            <span>{flash.error}</span>
            <button
              type="button"
              onClick={() => setDismissedError(flash?.error ?? null)}
              className="rounded p-1 text-red-700/80 transition hover:text-red-900"
              aria-label="Dismiss error message"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        <Deferred
          data="plans"
          fallback={
            <div className="space-y-2">
              <div className="h-16 animate-pulse rounded-md bg-gray-200 dark:bg-zinc-800" />
              <div className="h-16 animate-pulse rounded-md bg-gray-200 dark:bg-zinc-800" />
              <div className="h-16 animate-pulse rounded-md bg-gray-200 dark:bg-zinc-800" />
            </div>
          }
        >
          {() => (
            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-4 text-left">Plan</th>
                      <th className="px-4 py-4 text-left">Pricing</th>
                      <th className="px-4 py-4 text-left">Billing</th>
                      <th className="px-4 py-4 text-left">Usage</th>
                      <th className="px-4 py-4 text-left">Status</th>
                      <th className="px-4 py-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {plans?.data.length ? (
                      plans.data.map((plan) => (
                        <tr key={plan.id} className="align-top hover:bg-slate-50 dark:hover:bg-slate-800/25 transition-colors">
                          <td className="px-4 py-4">
                            <div className="space-y-2">
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white">{plan.name}</p>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {plan.is_recommended ? <Badge className="bg-emerald-600">Recommended</Badge> : null}
                                <Badge variant="outline">
                                  {plan.features?.length ?? 0} feature{(plan.features?.length ?? 0) === 1 ? '' : 's'}
                                </Badge>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {formatPrice(plan.final_price, plan.currency)}
                              </p>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              <Badge variant="outline">{billingIntervalLabels[plan.billing_interval]}</Badge>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Trial: {plan.trial_days} day{plan.trial_days === 1 ? '' : 's'}
                              </p>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div className="space-y-1 text-slate-600 dark:text-slate-300">
                              <p>{plan.subscriptions_count} subscription{plan.subscriptions_count === 1 ? '' : 's'}</p>
                              <p>{plan.payments_count} payment{plan.payments_count === 1 ? '' : 's'}</p>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <Badge
                              className={plan.status === 'active' ? 'bg-emerald-600' : ''}
                              variant={plan.status === 'active' ? 'default' : 'secondary'}
                            >
                              {statusLabels[plan.status]}
                            </Badge>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="gap-2"
                                // Changed to use slug for routing show
                                onClick={() => router.get(`/plans/${plan.slug}`)}
                              >
                                <Eye className="h-4 w-4" />
                                Show
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="gap-2"
                                onClick={() => openEditDialog(plan)}
                              >
                                <Pencil className="h-4 w-4" />
                                Edit
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                className="gap-2"
                                onClick={() => openDeleteDialog(plan)}
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400" colSpan={6}>
                          No plans found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {plans?.links && plans.links.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm">
                  {plans.links.map((link, index) =>
                    link.url ? (
                      <Link
                        key={index}
                        href={link.url}
                        className={`rounded-full border px-3 py-1 transition ${link.active ? 'border-slate-900 dark:border-slate-700 bg-slate-900 dark:bg-slate-700 text-white' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                      />
                    ) : (
                      <span
                        key={index}
                        className="rounded-full border border-slate-200 dark:border-slate-800 px-3 py-1 text-slate-400 dark:text-slate-500"
                        dangerouslySetInnerHTML={{ __html: link.label }}
                      />
                    ),
                  )}
                </div>
              ) : null}
            </div>
          )}
        </Deferred>

        <Dialog
          open={isDeleteOpen}
          onOpenChange={(open) => {
            setIsDeleteOpen(open);

            if (!open) {
              setDeleteTarget(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Delete plan</DialogTitle>
              <DialogDescription>
                This permanently removes the selected pricing plan.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-900/20 px-4 py-3 text-sm text-rose-900 dark:text-rose-400">
              {deleteTarget?.name ?? 'Selected plan'} will be deleted.
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
