import { Head, Link, router, usePage } from '@inertiajs/react';
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
    attachments: {
        url: string;
        mimeType: string;
        name: string;
        size: number;
    }[] | null;
    created_at: string;
    sender?: Sender | null;
};

type ChatDetail = {
    id: number;
    slug: string;
    title: string;
    status: 'active' | 'closed';
    messages_count: number;
    user?: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
        username: string;
        subscriptions?: {
            id: number;
            plan?: {
                id: number;
                name: string;
            } | null;
        }[] | null;
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
    user: 'bg-blue-600 text-white',
    assistant: 'bg-slate-100 text-slate-900',
    system: 'bg-amber-100 text-amber-900 border border-amber-200',
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
    const [localMessages, setLocalMessages] = useState<ChatMessage[]>(messages ?? []);
    const [showSuccess, setShowSuccess] = useState(Boolean(flash?.success));
    const [showError, setShowError] = useState(Boolean(flash?.error));
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    
    const [downloadTarget, setDownloadTarget] = useState<{ url: string; name: string } | null>(null);

    // Sync localMessages when Inertia loads the messages prop
    useEffect(() => {
        if (messages) {
            setLocalMessages(messages);
        }
    }, [messages]);

    // 100% Seamless Silent Polling Every 5 Seconds
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({
                only: ['messages'],
                preserveState: true,
                preserveScroll: true,
                showProgress: false, // Prevents the blue loading bar at the top
            });
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        setShowSuccess(Boolean(flash?.success));
    }, [flash?.success]);

    useEffect(() => {
        setShowError(Boolean(flash?.error));
    }, [flash?.error]);

    const confirmDelete = (): void => {
        router.delete(`/chats/${chat.id}`, {
            onSuccess: () => setIsDeleteOpen(false),
        });
    };

    const ownerName = chat.user
        ? `${chat.user.first_name} ${chat.user.last_name}`.trim()
        : 'Unknown user';

    // If messages is completely undefined, it means Inertia is still fetching the initial data
    const isInitialLoading = messages === undefined;

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
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-lg text-slate-900">{ownerName}</CardTitle>
                                {chat.user?.subscriptions && chat.user.subscriptions.length > 0 && chat.user.subscriptions[0].plan && (
                                    <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">
                                        {chat.user.subscriptions[0].plan.name}
                                    </Badge>
                                )}
                            </div>
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
                        {isInitialLoading ? (
                            <div className="space-y-4">
                                <div className="h-20 animate-pulse rounded-xl bg-slate-200" />
                                <div className="h-20 animate-pulse rounded-xl bg-slate-200" />
                                <div className="h-20 animate-pulse rounded-xl bg-slate-200" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {localMessages?.length ? (
                                    localMessages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex w-full ${msg.sender_role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`flex max-w-[85%] gap-3 ${msg.sender_role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                                {/* Avatar */}
                                                <div className="mt-auto flex-shrink-0">
                                                    {msg.sender_role === 'assistant' ? (
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 shadow-sm">
                                                            <Bot className="h-5 w-5" />
                                                        </div>
                                                    ) : msg.sender_role === 'user' ? (
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600 shadow-sm">
                                                            <User className="h-5 w-5" />
                                                        </div>
                                                    ) : (
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 shadow-sm">
                                                            <User className="h-5 w-5" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Message Bubble */}
                                                <div className="flex flex-col gap-1">
                                                    <div className={`flex items-center gap-2 ${msg.sender_role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                        <span className="text-[11px] font-medium text-slate-500">
                                                            {msg.sender_role === 'assistant' ? 'AI Assistant' : msg.sender ? `${msg.sender.first_name} ${msg.sender.last_name}` : 'User'}
                                                        </span>
                                                        <time className="text-[10px] text-slate-400">
                                                            {formatDate(msg.created_at)}
                                                        </time>
                                                    </div>

                                                    <div className={`rounded-2xl px-5 py-3.5 shadow-sm ${roleStyles[msg.sender_role] ?? 'bg-white border border-slate-200'} ${msg.sender_role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
                                                        <p className={`whitespace-pre-wrap text-sm leading-relaxed ${msg.sender_role === 'user' ? 'text-white' : 'text-slate-800'}`}>
                                                            {msg.content}
                                                        </p>

                                                        {msg.attachments && msg.attachments.length > 0 && (
                                                            <div className="mt-3 flex flex-col gap-2">
                                                                {msg.attachments.map((attachment, idx) => {
                                                                    const isImage = attachment.mimeType.startsWith('image/');
                                                                    const isVideo = attachment.mimeType.startsWith('video/');

                                                                    if (isImage) {
                                                                        return (
                                                                            <img 
                                                                                key={idx} 
                                                                                src={attachment.url} 
                                                                                alt={attachment.name} 
                                                                                className="max-h-64 max-w-full rounded-md object-contain border border-slate-200 bg-white" 
                                                                            />
                                                                        );
                                                                    }

                                                                    if (isVideo) {
                                                                        return (
                                                                            <video 
                                                                                key={idx} 
                                                                                src={attachment.url} 
                                                                                controls 
                                                                                className="max-h-64 max-w-full rounded-md border border-slate-200 bg-black" 
                                                                            />
                                                                        );
                                                                    }

                                                                    return (
                                                                        <button
                                                                            key={idx}
                                                                            type="button"
                                                                            onClick={() => setDownloadTarget(attachment)}
                                                                            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors w-max max-w-full overflow-hidden ${
                                                                                msg.sender_role === 'user' 
                                                                                    ? 'border-blue-500 bg-blue-700/50 text-blue-50 hover:bg-blue-700' 
                                                                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                                                            }`}
                                                                        >
                                                                            <span className="truncate font-medium">{attachment.name}</span>
                                                                            <span className="shrink-0 opacity-70">
                                                                                ({Math.round(attachment.size / 1024)} KB)
                                                                            </span>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-500">No messages in this chat yet.</p>
                                )}
                            </div>
                        )}
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
            <Dialog open={!!downloadTarget} onOpenChange={(open) => !open && setDownloadTarget(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Download Attachment</DialogTitle>
                        <DialogDescription>
                            Would you like to download this file?
                        </DialogDescription>
                    </DialogHeader>
                    {downloadTarget && (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 break-all">
                            <strong>{downloadTarget.name}</strong>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDownloadTarget(null)}>
                            Cancel
                        </Button>
                        {downloadTarget && (
                            <Button asChild>
                                <a 
                                    href={downloadTarget.url} 
                                    download={downloadTarget.name}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={() => setDownloadTarget(null)}
                                >
                                    Download
                                </a>
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}