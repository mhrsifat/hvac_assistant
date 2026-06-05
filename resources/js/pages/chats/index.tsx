import { Deferred, Head, router, useForm, usePage } from '@inertiajs/react';
import { Eye, MessageSquare, Plus, Search, Trash2, X } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
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
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/layouts/AdminLayout';

type UserOption = {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
};

type HvacModelOption = {
    id: number;
    name: string;
    brand?: { id: number; name: string } | null;
};

type Chat = {
    id: number;
    title: string;
    status: 'active' | 'closed';
    messages_count: number;
    user?: { id: number; first_name: string; last_name: string; email: string } | null;
    hvac_model?: { id: number; name: string; brand?: { id: number; name: string } | null } | null;
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

type ChatsPageProps = {
    chats?: PaginatedResponse<Chat>;
    users: UserOption[];
    hvacModels: HvacModelOption[];
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
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    closed: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function ChatsIndex() {
    const { chats, users, hvacModels, filters, flash } = usePage<ChatsPageProps>().props;
    const [showSuccess, setShowSuccess] = useState(Boolean(flash?.success));
    const [showError, setShowError] = useState(Boolean(flash?.error));
    const [search, setSearch] = useState(filters.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters.status ?? '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Chat | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const createForm = useForm<{
        user_id: string;
        hvac_model_id: string;
        title: string;
        status: 'active' | 'closed';
    }>({
        user_id: '',
        hvac_model_id: '',
        title: '',
        status: 'active',
    });

    useEffect(() => {
        setShowSuccess(Boolean(flash?.success));
    }, [flash?.success]);

    useEffect(() => {
        setShowError(Boolean(flash?.error));
    }, [flash?.error]);

    const submitCreate = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        createForm.post('/chats', {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
                setIsCreateOpen(false);
            },
        });
    };

    const applyFilters = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        router.get(
            '/chats',
            { search, status: statusFilter || undefined },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const updateStatus = (chatId: number, status: 'active' | 'closed'): void => {
        router.patch(`/chats/${chatId}/status`, { status }, { preserveScroll: true });
    };

    const openDeleteModal = (chat: Chat): void => {
        setDeleteTarget(chat);
        setIsDeleteOpen(true);
    };

    const confirmDelete = (): void => {
        if (!deleteTarget) {
            return;
        }

        router.delete(`/chats/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteOpen(false);
                setDeleteTarget(null);
            },
        });
    };

    return (
        <AdminLayout title="Chats">
            <Head title="Chats" />

            <div className="space-y-8">
                {/* Header */}
                <section className="relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm">
                    <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-violet-200/60 blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-blue-200/70 blur-3xl" />
                    <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Support</p>
                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Chats</h1>
                            <p className="max-w-xl text-sm text-slate-600">
                                View and manage all support chat sessions. Update their status or remove resolved
                                conversations.
                            </p>
                        </div>
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Create chat
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>Create chat</DialogTitle>
                                    <DialogDescription>Manually start a support session for a user.</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={submitCreate} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">User</label>
                                        <select
                                            className={`h-10 w-full rounded-md border px-3 text-sm ${createForm.errors.user_id ? 'border-red-500' : 'border-slate-200'}`}
                                            value={createForm.data.user_id}
                                            onChange={(e) => createForm.setData('user_id', e.target.value)}
                                        >
                                            <option value="">Select user</option>
                                            {users.map((user) => (
                                                <option key={user.id} value={user.id}>
                                                    {user.first_name} {user.last_name} ({user.email})
                                                </option>
                                            ))}
                                        </select>
                                        {createForm.errors.user_id && (
                                            <span className="text-xs text-red-500">{createForm.errors.user_id}</span>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            HVAC model (optional)
                                        </label>
                                        <select
                                            className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
                                            value={createForm.data.hvac_model_id}
                                            onChange={(e) => createForm.setData('hvac_model_id', e.target.value)}
                                        >
                                            <option value="">No model</option>
                                            {hvacModels.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.name}
                                                    {m.brand ? ` (${m.brand.name})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Chat title</label>
                                        <Input
                                            value={createForm.data.title}
                                            onChange={(e) => createForm.setData('title', e.target.value)}
                                            placeholder="e.g. Cooling issue in unit A"
                                            className={createForm.errors.title ? 'border-red-500' : ''}
                                        />
                                        {createForm.errors.title && (
                                            <span className="text-xs text-red-500">{createForm.errors.title}</span>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Initial status</label>
                                        <select
                                            className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
                                            value={createForm.data.status}
                                            onChange={(e) =>
                                                createForm.setData('status', e.target.value as 'active' | 'closed')
                                            }
                                        >
                                            <option value="active">Active</option>
                                            <option value="closed">Closed</option>
                                        </select>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsCreateOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={createForm.processing}>
                                            {createForm.processing ? 'Creating...' : 'Create chat'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </section>

                {/* Flash messages */}
                {flash?.success && showSuccess ? (
                    <div className="flex items-start justify-between gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                        <span>{flash.success}</span>
                        <button
                            type="button"
                            onClick={() => setShowSuccess(false)}
                            className="rounded p-1 text-emerald-700/80 transition hover:text-emerald-900"
                            aria-label="Dismiss"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : null}

                {flash?.error && showError ? (
                    <div className="flex items-start justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        <span>{flash.error}</span>
                        <button
                            type="button"
                            onClick={() => setShowError(false)}
                            className="rounded p-1 text-red-700/80 transition hover:text-red-900"
                            aria-label="Dismiss"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : null}

                {/* Filters */}
                <Card className="border-0 bg-white/90 shadow-sm">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-base">Filter chats</CardTitle>
                        <CardDescription>Search by title or username and filter by status.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={applyFilters} className="flex flex-col gap-3 sm:flex-row">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search chats..."
                                    className="pl-10"
                                />
                            </div>
                            <select
                                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">All statuses</option>
                                <option value="active">Active</option>
                                <option value="closed">Closed</option>
                            </select>
                            <Button type="submit" variant="outline">
                                Search
                            </Button>
                            {filters.search || filters.status ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="gap-1 text-slate-500"
                                    onClick={() => router.get('/chats', {}, { replace: true })}
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Clear
                                </Button>
                            ) : null}
                        </form>
                    </CardContent>
                </Card>

                {/* Table */}
                <Deferred
                    data="chats"
                    fallback={
                        <div className="space-y-2">
                            <div className="h-16 animate-pulse rounded-md bg-gray-200" />
                            <div className="h-16 animate-pulse rounded-md bg-gray-200" />
                            <div className="h-16 animate-pulse rounded-md bg-gray-200" />
                        </div>
                    }
                >
                    {() => (
                        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="border-b bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                                        <tr>
                                            <th className="px-4 py-4 text-left">Chat</th>
                                            <th className="px-4 py-4 text-left">User</th>
                                            <th className="px-4 py-4 text-left">Model</th>
                                            <th className="px-4 py-4 text-left">Messages</th>
                                            <th className="px-4 py-4 text-left">Status</th>
                                            <th className="px-4 py-4 text-left">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {chats?.data.map((chat) => (
                                            <tr
                                                key={chat.id}
                                                className="border-b transition-colors last:border-b-0 hover:bg-slate-50/50"
                                            >
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                                                            <MessageSquare className="h-4 w-4" />
                                                        </div>
                                                        <p className="max-w-[200px] truncate font-semibold text-slate-900">
                                                            {chat.title}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    {chat.user ? (
                                                        <div>
                                                            <p className="font-medium text-slate-800">
                                                                {chat.user.first_name} {chat.user.last_name}
                                                            </p>
                                                            <p className="text-xs text-slate-500">{chat.user.email}</p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    {chat.hvac_model ? (
                                                        <div>
                                                            <p className="text-sm text-slate-700">
                                                                {chat.hvac_model.name}
                                                            </p>
                                                            {chat.hvac_model.brand && (
                                                                <p className="text-xs text-slate-500">
                                                                    {chat.hvac_model.brand.name}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-slate-600">{chat.messages_count}</td>
                                                <td className="px-4 py-4">
                                                    <Badge
                                                        variant="outline"
                                                        className={`cursor-pointer capitalize ${statusStyles[chat.status] ?? ''}`}
                                                        onClick={() =>
                                                            updateStatus(
                                                                chat.id,
                                                                chat.status === 'active' ? 'closed' : 'active',
                                                            )
                                                        }
                                                        title="Click to toggle status"
                                                    >
                                                        {chat.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        <Button asChild variant="outline" size="sm">
                                                            <a href={`/chats/${chat.id}`} className="gap-2">
                                                                <Eye className="h-3.5 w-3.5" />
                                                                View
                                                            </a>
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
                                                            onClick={() => openDeleteModal(chat)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {chats?.data.length === 0 ? (
                                    <p className="p-6 text-sm text-slate-500">No chats found.</p>
                                ) : null}

                                {chats?.links && chats.links.length > 0 ? (
                                    <div className="flex flex-wrap items-center gap-2 border-t bg-slate-50 px-4 py-3 text-sm">
                                        {chats.links.map((link, index) =>
                                            link.url ? (
                                                <a
                                                    key={`${link.label}-${index}`}
                                                    href={link.url}
                                                    className={`rounded-full border px-3 py-1 transition ${
                                                        link.active
                                                            ? 'border-slate-900 bg-slate-900 text-white'
                                                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                                                    }`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ) : (
                                                <span
                                                    key={`${link.label}-${index}`}
                                                    className="rounded-full border border-slate-200 px-3 py-1 text-slate-400"
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ),
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    )}
                </Deferred>
            </div>

            {/* Delete confirmation dialog */}
            <Dialog
                open={isDeleteOpen}
                onOpenChange={(open) => {
                    setIsDeleteOpen(open);
                    if (!open) {
                        setDeleteTarget(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete chat</DialogTitle>
                        <DialogDescription>
                            Permanently remove this chat and all its messages.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                        You are about to delete <strong>"{deleteTarget?.title}"</strong>. This action cannot be undone.
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            Delete chat
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
