import { Deferred, Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Bot, Trash2, User, X } from 'lucide-react';
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
} from '@/components/ui/dialog';
import AdminLayout from '@/layouts/AdminLayout';

type Sender = {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
};

type ChatMessage = {
    id: number;
    sender_role: 'user' | 'assistant' | 'system';
    content: string;
    attachments: string[] | null;
    created_at: string;
    sender?: Sender | null;
};

type ChatDetail = {
    id: number;
    title: string;
    status: 'active' | 'closed';
    messages_count: number;
    user?: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
    } | null;
    hvac_model?: {
        id: number;
        name: string;
        model_number: string | null;
        brand?: { id: number; name: string; logo_path: string | null } | null;
    } | null;
};

type ChatShowProps = {
    chat: ChatDetail;
    messages?: ChatMessage[];
    flash?: {
        success?: string;
        error?: string;
    };
};

const statusStyles: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    closed: 'bg-slate-100 text-slate-600 border-slate-200',
};

const roleStyles: Record<string, string> = {
    user: 'bg-blue-50 border-blue-100',
    assistant: 'bg-slate-50 border-slate-200',
    system: 'bg-amber-50 border-amber-100',
};

const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function ChatShow() {
    const { chat, messages, flash } = usePage<ChatShowProps>().props;
    const [showSuccess, setShowSuccess] = useState(Boolean(flash?.success));
    const [showError, setShowError] = useState(Boolean(flash?.error));
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    useEffect(() => {
        setShowSuccess(Boolean(flash?.success));
    }, [flash?.success]);

    useEffect(() => {
        setShowError(Boolean(flash?.error));
    }, [flash?.error]);

    const toggleStatus = (): void => {
        const newStatus = chat.status === 'active' ? 'closed' : 'active';
        router.patch(`/chats/${chat.id}/status`, { status: newStatus }, { preserveScroll: true });
    };

    const confirmDelete = (): void => {
        router.delete(`/chats/${chat.id}`, {
            onSuccess: () => setIsDeleteOpen(false),
        });
    };

    const ownerName = chat.user
        ? `${chat.user.first_name} ${chat.user.last_name}`.trim()
        : 'Unknown user';

    return (
        <AdminLayout title={`Chat — ${chat.title}`}>
            <Head title={`${chat.title} — Chat`} />

            <div className="space-y-8">
                {/* Header */}
                <section className="relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm">
                    <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-violet-100/80 blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-blue-100/70 blur-3xl" />
                    <div className="relative space-y-4">
                        <Link
                            href="/chats"
                            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to chats
                        </Link>
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                    Chat thread
                                </p>
                                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{chat.title}</h1>
                                <p className="text-sm text-slate-600">
                                    {ownerName} · {chat.messages_count} message{chat.messages_count !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Button
                                    variant="outline"
                                    onClick={toggleStatus}
                                    className={`capitalize ${statusStyles[chat.status] ?? ''}`}
                                >
                                    {chat.status === 'active' ? 'Mark as closed' : 'Mark as active'}
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="gap-2"
                                    onClick={() => setIsDeleteOpen(true)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete chat
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Flash messages */}
                {flash?.success && showSuccess ? (
                    <div className="flex items-start justify-between gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                        <span>{flash.success}</span>
                        <button onClick={() => setShowSuccess(false)} className="rounded p-1">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : null}

                {flash?.error && showError ? (
                    <div className="flex items-start justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        <span>{flash.error}</span>
                        <button onClick={() => setShowError(false)} className="rounded p-1">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : null}

                {/* Meta cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="space-y-1">
                            <CardDescription>Status</CardDescription>
                            <CardTitle className="text-xl">
                                <Badge
                                    variant="outline"
                                    className={`capitalize ${statusStyles[chat.status] ?? ''}`}
                                >
                                    {chat.status}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="space-y-1">
                            <CardDescription>User</CardDescription>
                            <CardTitle className="text-lg text-slate-900">{ownerName}</CardTitle>
                            {chat.user?.email && (
                                <p className="text-xs text-slate-500">{chat.user.email}</p>
                            )}
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="space-y-1">
                            <CardDescription>HVAC model</CardDescription>
                            {chat.hvac_model ? (
                                <>
                                    <CardTitle className="text-lg text-slate-900">{chat.hvac_model.name}</CardTitle>
                                    {chat.hvac_model.brand && (
                                        <p className="text-xs text-slate-500">{chat.hvac_model.brand.name}</p>
                                    )}
                                    <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs">
                                        <Link href={`/hvac-models/${chat.hvac_model.id}`}>View model →</Link>
                                    </Button>
                                </>
                            ) : (
                                <CardTitle className="text-base text-slate-400">Not specified</CardTitle>
                            )}
                        </CardHeader>
                    </Card>
                </div>

                {/* Messages thread */}
                <Card className="border-0 bg-white/90 shadow-sm">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-base">Message thread</CardTitle>
                        <CardDescription>Full conversation in chronological order.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Deferred
                            data="messages"
                            fallback={
                                <div className="space-y-4">
                                    <div className="h-20 animate-pulse rounded-xl bg-slate-200" />
                                    <div className="h-20 animate-pulse rounded-xl bg-slate-200" />
                                    <div className="h-20 animate-pulse rounded-xl bg-slate-200" />
                                </div>
                            }
                        >
                            {() => (
                                <div className="space-y-4">
                                    {messages?.length ? (
                                        messages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={`rounded-xl border p-4 ${roleStyles[msg.sender_role] ?? 'bg-white border-slate-200'}`}
                                            >
                                                <div className="mb-2 flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2">
                                                        {msg.sender_role === 'assistant' ? (
                                                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                                                                <Bot className="h-4 w-4" />
                                                            </div>
                                                        ) : (
                                                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                                                <User className="h-4 w-4" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            {msg.sender_role === 'assistant' ? (
                                                                <p className="text-xs font-semibold text-slate-600">
                                                                    AI Assistant
                                                                </p>
                                                            ) : msg.sender ? (
                                                                <p className="text-xs font-semibold text-slate-800">
                                                                    {msg.sender.first_name} {msg.sender.last_name}
                                                                </p>
                                                            ) : (
                                                                <p className="text-xs font-semibold capitalize text-slate-600">
                                                                    {msg.sender_role}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <Badge
                                                            variant="outline"
                                                            className="h-5 px-1.5 text-[10px] capitalize"
                                                        >
                                                            {msg.sender_role}
                                                        </Badge>
                                                    </div>
                                                    <time className="text-xs text-slate-400">
                                                        {formatDate(msg.created_at)}
                                                    </time>
                                                </div>
                                                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                                                    {msg.content}
                                                </p>
                                                {msg.attachments && msg.attachments.length > 0 && (
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {msg.attachments.map((url, idx) => (
                                                            <a
                                                                key={idx}
                                                                href={url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:border-slate-400"
                                                            >
                                                                Attachment {idx + 1}
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-slate-500">No messages in this chat yet.</p>
                                    )}
                                </div>
                            )}
                        </Deferred>
                    </CardContent>
                </Card>
            </div>

            {/* Delete chat dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Delete chat</DialogTitle>
                        <DialogDescription>
                            Permanently remove this chat and all its messages.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                        You are about to delete <strong>"{chat.title}"</strong>. This action cannot be undone.
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
