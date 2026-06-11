import { Deferred, Head, router, useForm, usePage } from '@inertiajs/react';
import { Eye, MessageSquare, Search, Trash2, X } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
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

function LocalSearchableSelect({
    options,
    value,
    onChange,
    placeholder,
    renderItem,
    filterItem,
}: {
    options: any[];
    value: string;
    onChange: (val: string) => void;
    placeholder: string;
    renderItem: (item: any) => React.ReactNode;
    filterItem: (item: any, query: string) => boolean;
}) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const selectedItem = options.find(o => String(o.id) === String(value));

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(o => filterItem(o, query));

    return (
        <div className="relative min-w-[200px]" ref={wrapperRef}>
            {selectedItem ? (
                <div className="flex h-10 items-center justify-between rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm overflow-hidden">
                    <div className="flex-1 min-w-0 overflow-hidden">
                        {renderItem(selectedItem)}
                    </div>
                    <button type="button" onClick={() => {
 onChange(''); setQuery(''); 
}} className="ml-2 shrink-0 text-slate-400 hover:text-slate-600 dark:text-slate-300">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ) : (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        value={query}
                        onChange={(e) => {
 setQuery(e.target.value); setIsOpen(true); 
}}
                        onFocus={() => setIsOpen(true)}
                        placeholder={placeholder}
                        className="pl-9 h-10 border-slate-200 dark:border-slate-800"
                        autoComplete="off"
                    />
                    {isOpen && (
                        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map(option => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800/25 dark:bg-slate-800/50"
                                        onClick={() => {
                                            onChange(String(option.id));
                                            setIsOpen(false);
                                            setQuery('');
                                        }}
                                    >
                                        {renderItem(option)}
                                    </button>
                                ))
                            ) : (
                                <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">No results found</div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

type UserOption = {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    avatar?: string;
};

type HvacModelOption = {
    id: number;
    name: string;
    image_path?: string;
    brand?: { id: number; name: string } | null;
};

type BrandOption = {
    id: number;
    name: string;
};

type Chat = {
    id: number;
    title: string;
    slug: string;
    status: 'active' | 'closed' | 'limitHit';
    messages_count: number;
    user?: { 
        id: number; 
        first_name: string; 
        last_name: string; 
        email: string;
        subscriptions?: {
            id: number;
            plan?: {
                id: number;
                name: string;
            } | null;
        }[] | null;
    } | null;
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
    users?: UserOption[];
    hvacModels?: HvacModelOption[];
    brands?: BrandOption[];
    filters: {
        search?: string;
        status?: string;
        user_id?: string;
        hvac_model_id?: string;
        brand_id?: string;
    };
    flash?: {
        success?: string;
        error?: string;
    };
};

const renderUserOption = (u: UserOption) => (
    <div className="flex items-center gap-2">
        {u.avatar ? (
            <img src={u.avatar} alt="" className="h-6 w-6 rounded-full object-cover border border-slate-200 dark:border-slate-800" />
        ) : (
            <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 dark:text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                {u.first_name?.[0] || u.email[0].toUpperCase()}
            </div>
        )}
        <div 
            className="flex-1 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
            {u.first_name} {u.last_name} <span className="text-slate-500 dark:text-slate-400 text-xs">({u.email})</span>
        </div>
    </div>
);

const renderModelOption = (m: HvacModelOption) => (
    <div className="flex items-center gap-2">
        {m.image_path ? (
            <img src={m.image_path} alt="" className="h-6 w-6 rounded-md object-cover border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />
        ) : (
            <div className="h-6 w-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-800 shrink-0">
                <div className="h-3 w-3 bg-slate-300 rounded-sm"></div>
            </div>
        )}
        <div 
            className="flex-1 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
            {m.name}{m.brand ? <span className="text-slate-500 dark:text-slate-400 text-xs ml-1">({m.brand.name})</span> : ''}
        </div>
    </div>
);

const statusStyles: Record<string, string> = {
    active: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    closed: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800',
    limitHit: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function ChatsIndex() {
    const { chats, users, hvacModels, brands, filters, flash } = usePage<ChatsPageProps>().props;
    const [dismissedSuccess, setDismissedSuccess] = useState<string | null>(null);
    const [dismissedError, setDismissedError] = useState<string | null>(null);
    const showSuccess = Boolean(flash?.success) && flash?.success !== dismissedSuccess;
    const showError = Boolean(flash?.error) && flash?.error !== dismissedError;
    const [search, setSearch] = useState(filters.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters.status ?? '');
    const [userFilter, setUserFilter] = useState(filters.user_id ?? '');
    const [hvacModelFilter, setHvacModelFilter] = useState(filters.hvac_model_id ?? '');
    const [brandFilter, setBrandFilter] = useState(filters.brand_id ?? '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Chat | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const visibleChats = (chats?.data ?? []).filter((chat) => chat.messages_count > 0);

    const createForm = useForm<{
        user_id: string;
        hvac_model_id: string;
        title: string;
        status: 'active' | 'closed' | 'limitHit';
    }>({
        user_id: '',
        hvac_model_id: '',
        title: '',
        status: 'active',
    });


    // 100% Seamless Silent Polling Every 5 Seconds
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({
                only: ['chats'], // Only fetch the chats data silently
                preserveState: true,
                preserveScroll: true,
                showProgress: false, // Prevents the blue loading bar at the top
            } as any);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

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
            { 
                search, 
                status: statusFilter || undefined,
                user_id: userFilter || undefined,
                hvac_model_id: hvacModelFilter || undefined,
                brand_id: brandFilter || undefined,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const openDeleteModal = (chat: Chat): void => {
        setDeleteTarget(chat);
        setIsDeleteOpen(true);
    };

    const confirmDelete = (): void => {
        if (!deleteTarget) {
            return;
        }

        router.delete(`/chats/${deleteTarget.slug}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteOpen(false);
                setDeleteTarget(null);
            },
        });
    };

    const availableModels = brandFilter 
        ? hvacModels?.filter(m => String(m.brand?.id) === String(brandFilter)) 
        : hvacModels;

    // টেবিল রেন্ডার করার ফাংশন যাতে কোড ডুপ্লিকেট না হয়
    const renderChatsTable = () => (
        <div className="overflow-hidden rounded-2xl border bg-white dark:bg-slate-900 shadow-sm">
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="border-b bg-slate-50 dark:bg-slate-800/50 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
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
                        {visibleChats.map((chat) => (
                            <tr
                                key={chat.id}
                                className="border-b transition-colors last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/25 dark:bg-slate-800/50"
                            >
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                                            <MessageSquare className="h-4 w-4" />
                                        </div>
                                        <p className="max-w-[200px] truncate font-semibold text-slate-900 dark:text-white">
                                            {chat.title}
                                        </p>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    {chat.user ? (
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-slate-800 dark:text-slate-100">
                                                    {chat.user.first_name} {chat.user.last_name}
                                                </p>
                                                {chat.user.subscriptions && chat.user.subscriptions.length > 0 && chat.user.subscriptions[0].plan && (
                                                    <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20">
                                                        {chat.user.subscriptions[0].plan.name}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{chat.user.email}</p>
                                        </div>
                                    ) : (
                                        <span className="text-slate-400">—</span>
                                    )}
                                </td>
                                <td className="px-4 py-4">
                                    {chat.hvac_model ? (
                                        <div>
                                            <p className="text-sm text-slate-700 dark:text-slate-300">
                                                {chat.hvac_model.name}
                                            </p>
                                            {chat.hvac_model.brand && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {chat.hvac_model.brand.name}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-slate-400">—</span>
                                    )}
                                </td>
                                <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{chat.messages_count}</td>
                                <td className="px-4 py-4">
                                    <Badge
                                        variant="outline"
                                        className={`capitalize ${statusStyles[chat.status] ?? ''}`}
                                    >
                                        {chat.status}
                                    </Badge>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex flex-wrap gap-2">
                                        <Button asChild variant="outline" size="sm">
                                            <a href={`/chats/${chat.slug}`} className="gap-2">
                                                <Eye className="h-3.5 w-3.5" />
                                                View
                                            </a>
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="gap-1.5 border-red-200 dark:border-red-500/20 text-red-600 hover:bg-red-50 dark:bg-red-500/10"
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

                {visibleChats.length === 0 ? (
                    <p className="p-6 text-sm text-slate-500 dark:text-slate-400">No chats found.</p>
                ) : null}

                {chats?.links && chats.links.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2 border-t bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm">
                        {chats.links.map((link, index) =>
                            link.url ? (
                                <a
                                    key={`${link.label}-${index}`}
                                    href={link.url}
                                    className={`rounded-full border px-3 py-1 transition ${
                                        link.active
                                            ? 'border-slate-900 bg-slate-900 text-white'
                                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-slate-400'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ) : (
                                <span
                                    key={`${link.label}-${index}`}
                                    className="rounded-full border border-slate-200 dark:border-slate-800 px-3 py-1 text-slate-400"
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ),
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    );

    return (
        <AdminLayout title="Chats">
            <Head title="Chats" />

            <div className="space-y-8">
                {/* Header */}
                <section className="relative overflow-hidden rounded-2xl border bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-violet-200/60 blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-blue-200/70 blur-3xl" />
                    <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Support</p>
                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Chats</h1>
                            <p className="max-w-xl text-sm text-slate-600 dark:text-slate-300">
                                View and manage all support chat sessions. Update their status or remove resolved
                                conversations.
                            </p>
                        </div>
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                {/* <Button className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Create chat
                                </Button> */}
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>Create chat</DialogTitle>
                                    <DialogDescription>Manually start a support session for a user.</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={submitCreate} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">User</label>
                                        <LocalSearchableSelect
                                            options={users ?? []}
                                            value={createForm.data.user_id}
                                            onChange={(val) => createForm.setData('user_id', val)}
                                            placeholder="Search User..."
                                            renderItem={renderUserOption}
                                            filterItem={(u, q) => {
                                                const searchStr = `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase();

                                                return searchStr.includes(q.toLowerCase());
                                            }}
                                        />
                                        {createForm.errors.user_id && (
                                            <span className="text-xs text-red-500">{createForm.errors.user_id}</span>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">HVAC Model</label>
                                        <LocalSearchableSelect
                                            options={hvacModels ?? []}
                                            value={createForm.data.hvac_model_id}
                                            onChange={(val) => createForm.setData('hvac_model_id', val)}
                                            placeholder="Search Model..."
                                            renderItem={renderModelOption}
                                            filterItem={(m, q) => m.name.toLowerCase().includes(q.toLowerCase())}
                                        />
                                        {createForm.errors.hvac_model_id && (
                                            <span className="text-xs text-red-500">{createForm.errors.hvac_model_id}</span>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Chat title</label>
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
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Initial status</label>
                                        <select
                                            className={`h-10 w-full rounded-md border bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 ${createForm.errors.status ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'}`}
                                            value={createForm.data.status}
                                            onChange={(e) => createForm.setData('status', e.target.value as 'active' | 'closed' | 'limitHit')}
                                            required
                                        >
                                            <option value="active" className="bg-white dark:bg-slate-900">Active</option>
                                            <option value="closed" className="bg-white dark:bg-slate-900">Closed</option>
                                            <option value="limitHit" className="bg-white dark:bg-slate-900">LimitHit</option>
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
                    <div className="flex items-start justify-between gap-3 rounded-md border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
                        <span>{flash.success}</span>
                        <button
                            type="button"
                            onClick={() => setDismissedSuccess(flash?.success ?? null)}
                            className="rounded p-1 text-emerald-700 dark:text-emerald-400/80 transition hover:text-emerald-900"
                            aria-label="Dismiss"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : null}

                {flash?.error && showError ? (
                    <div className="flex items-start justify-between gap-3 rounded-md border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400">
                        <span>{flash.error}</span>
                        <button
                            type="button"
                            onClick={() => setDismissedError(flash?.error ?? null)}
                            className="rounded p-1 text-red-700 dark:text-red-400/80 transition hover:text-red-900"
                            aria-label="Dismiss"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : null}

                {/* Filters */}
                <Card className="border-0 bg-white dark:bg-slate-900/90 shadow-sm overflow-visible">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-base">Filter chats</CardTitle>
                        <CardDescription>Search by title or username and filter by status.</CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-visible">
                        <form onSubmit={applyFilters} className="flex flex-col gap-3">
                            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                                <div className="relative flex-1 min-w-[200px]">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search chats..."
                                        className="pl-10"
                                    />
                                </div>
                                <div className="min-w-[200px]">
                                    <LocalSearchableSelect
                                        options={users ?? []}
                                        value={userFilter}
                                        onChange={setUserFilter}
                                        placeholder="Search Users..."
                                        renderItem={renderUserOption}
                                        filterItem={(u, q) => {
                                            const searchStr = `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase();

                                            return searchStr.includes(q.toLowerCase());
                                        }}
                                    />
                                </div>
                                <select
                                    className="h-10 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 text-sm"
                                    value={brandFilter}
                                    onChange={(e) => {
                                        setBrandFilter(e.target.value);
                                        setHvacModelFilter(''); // Reset model when brand changes
                                    }}
                                >
                                    <option value="" className="bg-white dark:bg-slate-900">All Brands</option>
                                    {brands?.map(b => (
                                        <option key={b.id} value={b.id} className="bg-white dark:bg-slate-900">{b.name}</option>
                                    ))}
                                </select>
                                <div className="min-w-[200px]">
                                    <LocalSearchableSelect
                                        options={availableModels ?? []}
                                        value={hvacModelFilter}
                                        onChange={setHvacModelFilter}
                                        placeholder="Search Models..."
                                        renderItem={renderModelOption}
                                        filterItem={(m, q) => m.name.toLowerCase().includes(q.toLowerCase())}
                                    />
                                </div>
                                <select
                                    className="h-10 min-w-[130px] rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-700 dark:text-slate-300"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="" className="bg-white dark:bg-slate-900">All statuses</option>
                                    <option value="active" className="bg-white dark:bg-slate-900">Active</option>
                                    <option value="closed" className="bg-white dark:bg-slate-900">Closed</option>
                                    <option value="limitHit" className="bg-white dark:bg-slate-900">LimitHit</option>
                                </select>
                                <Button type="submit" variant="outline">
                                    Search
                                </Button>
                                {filters.search || filters.status || filters.user_id || filters.brand_id || filters.hvac_model_id ? (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="gap-1 text-slate-500 dark:text-slate-400"
                                        onClick={() => {
                                            setSearch('');
                                            setStatusFilter('');
                                            setUserFilter('');
                                            setHvacModelFilter('');
                                            setBrandFilter('');
                                            router.get('/chats', {}, { replace: true });
                                        }}
                                    >
                                        <X className="h-3.5 w-3.5" />
                                        Clear
                                    </Button>
                                ) : null}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Table */}
                {chats === undefined ? (
                    <Deferred
                        data="chats"
                        fallback={
                            <div className="space-y-2">
                                <div className="h-16 animate-pulse rounded-md bg-gray-200 dark:bg-slate-800" />
                                <div className="h-16 animate-pulse rounded-md bg-gray-200 dark:bg-slate-800" />
                                <div className="h-16 animate-pulse rounded-md bg-gray-200 dark:bg-slate-800" />
                            </div>
                        }
                    >
                        {() => renderChatsTable()}
                    </Deferred>
                ) : (
                    renderChatsTable()
                )}
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
