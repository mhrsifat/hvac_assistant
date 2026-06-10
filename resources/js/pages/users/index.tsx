import { Deferred, Head, Link, router, usePage } from '@inertiajs/react';
import { CheckCircle2, Eye, Search, XCircle, X } from 'lucide-react';
import {  useState } from 'react';
import type {FormEvent} from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/layouts/AdminLayout';

type User = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  username: string | null;
  avatar: string | null;
  status: string | null;
  email_verified_at: string | null;
  subscriptions_count: number;
  payments_count: number;
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
  users?: PaginatedResponse<User>;
  filters: {
    search: string;
    status: string;
  };
  flash?: {
    success?: string;
    error?: string;
  };
};

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
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

  return user.username || 'No Name';
};

export default function UsersIndex() {
  const { users, filters, flash } = usePage<PageProps>().props;
  const [searchValue, setSearchValue] = useState(filters.search ?? '');
  const [statusValue, setStatusValue] = useState(filters.status ?? '');
  const [dismissedSuccess, setDismissedSuccess] = useState<string | null>(null);
  const showSuccess = Boolean(flash?.success) && flash?.success !== dismissedSuccess;

  const applyFilters = () => {
    router.get(
      '/users',
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
    router.get('/users', {}, { preserveState: true, preserveScroll: true });
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applyFilters();
  };

  const handleStatusChange = (value: string) => {
    setStatusValue(value);
    router.get(
      '/users',
      {
        ...(searchValue ? { search: searchValue } : {}),
        ...(value ? { status: value } : {}),
      },
      { preserveState: true, preserveScroll: true },
    );
  };

  return (
    <AdminLayout title="Users">
      <Head title="User Management" />

      <div className="space-y-8">
        {/* Header */}
        <section className="relative overflow-hidden rounded-2xl border bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-violet-200/60 blur-3xl" />
          <div className="absolute -left-24 -bottom-24 h-48 w-48 rounded-full bg-cyan-200/70 blur-3xl" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                Administration
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                User Management
              </h1>
              <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                View user profiles, manage subscriptions, and monitor account activity.
              </p>
            </div>
          </div>
        </section>

        {/* Flash */}
        {flash?.success && showSuccess ? (
          <div className="flex items-start justify-between gap-3 rounded-md border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
            <span>{flash.success}</span>
            <button type="button" onClick={() => setDismissedSuccess(flash?.success ?? null)} className="rounded p-1 text-emerald-700 dark:text-emerald-400/80 transition hover:text-emerald-900" aria-label="Dismiss">
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
              placeholder="Search by name, email, or username..."
              className="pl-10"
            />
          </form>
          <select
            value={statusValue}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="h-10 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 text-sm min-w-[120px]"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900">{opt.label}</option>
            ))}
          </select>
          {(filters.search || filters.status) ? (
            <Button type="button" variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-slate-500 dark:text-slate-400">
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          ) : null}
        </div>

        {/* Table */}
        <Deferred
          data="users"
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
            <div className="overflow-hidden rounded-2xl border bg-white dark:bg-slate-900 shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b bg-slate-50 dark:bg-slate-800/50 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-4 text-left">User</th>
                      <th className="px-4 py-4 text-left">Username</th>
                      <th className="px-4 py-4 text-left">Status</th>
                      <th className="px-4 py-4 text-left">Verified</th>
                      <th className="px-4 py-4 text-left">Subscriptions</th>
                      <th className="px-4 py-4 text-left">Payments</th>
                      <th className="px-4 py-4 text-left">Joined</th>
                      <th className="px-4 py-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users?.data.length ? (
                      users.data.map((user) => (
                        <tr key={user.id} className="border-b last:border-b-0 align-top hover:bg-slate-50 dark:hover:bg-slate-800/25 dark:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              {user.avatar ? (
                                <img src={user.avatar} alt="Avatar" className="h-9 w-9 rounded-full object-cover border border-slate-200 dark:border-slate-800" />
                              ) : (
                                <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                                  {user.first_name?.[0] || user.email[0].toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white">{getUserDisplayName(user)}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{user.username || '—'}</span>
                          </td>

                          <td className="px-4 py-4">
                            <Badge
                              variant="outline"
                              className={user.status === 'active'
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'}
                            >
                              {user.status || 'unknown'}
                            </Badge>
                          </td>

                          <td className="px-4 py-4">
                            {user.email_verified_at ? (
                              <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                                <CheckCircle2 className="h-4 w-4" />
                                Verified
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-red-500 text-xs font-medium">
                                <XCircle className="h-4 w-4" />
                                Unverified
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                            {user.subscriptions_count}
                          </td>

                          <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                            {user.payments_count}
                          </td>

                          <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                            {formatDate(user.created_at)}
                          </td>

                          <td className="px-4 py-4">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="gap-1.5"
                              onClick={() => router.get(`/users/${user.username}`)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400" colSpan={8}>
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {users?.links && users.links.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2 border-t bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm">
                  {users.links.map((link, index) =>
                    link.url ? (
                      <Link
                        key={index}
                        href={link.url}
                        className={`rounded-full border px-3 py-1 transition ${link.active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'}`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                      />
                    ) : (
                      <span
                        key={index}
                        className="rounded-full border border-slate-200 dark:border-slate-800 px-3 py-1 text-slate-400"
                        dangerouslySetInnerHTML={{ __html: link.label }}
                      />
                    ),
                  )}
                </div>
              ) : null}
            </div>
          )}
        </Deferred>
      </div>
    </AdminLayout>
  );
}
