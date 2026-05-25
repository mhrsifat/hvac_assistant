import AdminLayout from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Deferred, Head, router, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

type UserOption = {
    id: number;
    name: string;
    email: string;
};

type HvacModelOption = {
    id: number;
    name: string;
    brand?: {
        id: number;
        name: string;
    } | null;
};

type Chat = {
    id: number;
    title: string;
    status: 'active' | 'closed';
    user?: UserOption | null;
    hvac_model?: HvacModelOption | null;
    messages_count: number;
};

type PaginatedResponse<T> = {
    data: T[];
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

export default function ChatsIndex() {
    const { chats, users, hvacModels, filters, flash } = usePage<ChatsPageProps>().props;
    const [search, setSearch] = useState(filters.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters.status ?? '');
    const createForm = useForm<{
        user_id: string;
        hvac_model_id: string;
        title: string;
        status: 'active' | 'closed';
    }>({
        user_id: users[0]?.id ? String(users[0].id) : '',
        hvac_model_id: '',
        title: '',
        status: 'active',
    });

    const submitCreate = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        createForm.post('/chats', {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset('hvac_model_id', 'title');
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
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const updateStatus = (chatId: number, status: 'active' | 'closed'): void => {
        router.patch(
            `/chats/${chatId}/status`,
            { status },
            {
                preserveScroll: true,
            },
        );
    };

    const deleteChat = (chatId: number): void => {
        router.delete(`/chats/${chatId}`, {
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout title="Chats">
            <Head title="Chats" />

            <div className="space-y-6">
                <h1 className="text-2xl font-semibold">Chats</h1>

                {flash?.success ? (
                    <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                        {flash.success}
                    </p>
                ) : null}

                {flash?.error ? (
                    <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {flash.error}
                    </p>
                ) : null}

                <form
                    onSubmit={submitCreate}
                    className="grid gap-3 rounded-lg border bg-white p-4 dark:bg-zinc-900 md:grid-cols-4"
                >
                    <select
                        className="h-10 rounded-md border px-3"
                        value={createForm.data.user_id}
                        onChange={(event) =>
                            createForm.setData('user_id', event.target.value)
                        }
                    >
                        <option value="">Select user</option>
                        {users.map((user) => (
                            <option key={user.id} value={user.id}>
                                {user.name} ({user.email})
                            </option>
                        ))}
                    </select>

                    <select
                        className="h-10 rounded-md border px-3"
                        value={createForm.data.hvac_model_id}
                        onChange={(event) =>
                            createForm.setData(
                                'hvac_model_id',
                                event.target.value,
                            )
                        }
                    >
                        <option value="">No model</option>
                        {hvacModels.map((hvacModel) => (
                            <option key={hvacModel.id} value={hvacModel.id}>
                                {hvacModel.name}
                                {hvacModel.brand
                                    ? ` (${hvacModel.brand.name})`
                                    : ''}
                            </option>
                        ))}
                    </select>

                    <Input
                        value={createForm.data.title}
                        onChange={(event) =>
                            createForm.setData('title', event.target.value)
                        }
                        placeholder="Chat title"
                    />

                    <select
                        className="h-10 rounded-md border px-3"
                        value={createForm.data.status}
                        onChange={(event) =>
                            createForm.setData(
                                'status',
                                event.target.value as 'active' | 'closed',
                            )
                        }
                    >
                        <option value="active">Active</option>
                        <option value="closed">Closed</option>
                    </select>

                    <Button
                        type="submit"
                        disabled={createForm.processing}
                        className="md:col-span-4"
                    >
                        {createForm.processing ? 'Creating...' : 'Create Chat'}
                    </Button>
                </form>

                <form onSubmit={applyFilters} className="grid gap-3 md:grid-cols-3">
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search chat..."
                    />
                    <select
                        className="h-10 rounded-md border px-3"
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                    >
                        <option value="">All statuses</option>
                        <option value="active">Active</option>
                        <option value="closed">Closed</option>
                    </select>
                    <Button type="submit" variant="outline">
                        Apply Filter
                    </Button>
                </form>

                <Deferred
                    data="chats"
                    fallback={
                        <div className="space-y-2">
                            <div className="h-12 animate-pulse rounded-md bg-gray-200 dark:bg-zinc-800" />
                            <div className="h-12 animate-pulse rounded-md bg-gray-200 dark:bg-zinc-800" />
                            <div className="h-12 animate-pulse rounded-md bg-gray-200 dark:bg-zinc-800" />
                        </div>
                    }
                >
                    {() => (
                        <div className="overflow-x-auto rounded-lg border bg-white dark:bg-zinc-900">
                            <table className="min-w-full text-sm">
                                <thead className="border-b bg-gray-50 dark:bg-zinc-800">
                                    <tr>
                                        <th className="px-4 py-3 text-left">
                                            Title
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                            User
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                            Model
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                            Messages
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {chats?.data.map((chat) => (
                                        <tr
                                            key={chat.id}
                                            className="border-b last:border-b-0"
                                        >
                                            <td className="px-4 py-3">
                                                {chat.title}
                                            </td>
                                            <td className="px-4 py-3">
                                                {chat.user?.name ?? '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {chat.hvac_model?.name ?? '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {chat.messages_count}
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    className="h-9 rounded-md border px-2"
                                                    value={chat.status}
                                                    onChange={(event) =>
                                                        updateStatus(
                                                            chat.id,
                                                            event.target
                                                                .value as
                                                                | 'active'
                                                                | 'closed',
                                                        )
                                                    }
                                                >
                                                    <option value="active">
                                                        Active
                                                    </option>
                                                    <option value="closed">
                                                        Closed
                                                    </option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        deleteChat(chat.id)
                                                    }
                                                >
                                                    Delete
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {chats?.data.length === 0 ? (
                                <p className="p-4 text-sm text-gray-500">
                                    No chats found.
                                </p>
                            ) : null}
                        </div>
                    )}
                </Deferred>
            </div>
        </AdminLayout>
    );
}
