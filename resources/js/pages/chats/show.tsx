import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Bot, Trash2, User, X, FileText, Download, Eye, Maximize2, Minimize2 } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
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
    avatar?: string | null;
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
    status: 'active' | 'closed' | 'limitHit';
    messages_count: number;
    user?: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
        username: string;
        avatar?: string | null;
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
        slug: string;
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
    active: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    closed: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800',
    limitHit: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
};

const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function ChatShow() {
    const { chat, messages, flash } = usePage<ChatShowProps>().props;
    const [dismissedSuccess, setDismissedSuccess] = useState<string | null>(null);
    const [dismissedError, setDismissedError] = useState<string | null>(null);
    const showSuccess = Boolean(flash?.success) && flash?.success !== dismissedSuccess;
    const showError = Boolean(flash?.error) && flash?.error !== dismissedError;
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    
    const [downloadTarget, setDownloadTarget] = useState<{ url: string; name: string } | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const prevMessagesLength = useRef<number>(0);

    // Fullscreen State
    const [isChatFullscreen, setIsChatFullscreen] = useState(false);

    // 100% Seamless Silent Polling Every 5 Seconds
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({
                only: ['messages'],
                preserveState: true,
                preserveScroll: true,
                showProgress: false,
            });
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    // Smart auto-scroll logic (Fixed: Will not auto-scroll to bottom on first load)
    useEffect(() => {
        const container = chatContainerRef.current;
        if (!container || !messages) return;

        const currentLength = messages.length;
        const isInitialLoad = prevMessagesLength.current === 0;
        const hasNewMessages = currentLength > prevMessagesLength.current;

        if (isInitialLoad) {
            // Keep at top or let browser handle native position on first load
            container.scrollTop = 0;
        } else if (hasNewMessages) {
            // Only scroll down if the user is already looking at recent messages near the bottom
            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
            if (isNearBottom) {
                container.scrollTop = container.scrollHeight;
            }
        }

        prevMessagesLength.current = currentLength;
    }, [messages]);

    const confirmDelete = (): void => {
        router.delete(`/chats/${chat.slug}`, {
            onSuccess: () => setIsDeleteOpen(false),
        });
    };

    const ownerName = chat.user
        ? `${chat.user.first_name} ${chat.user.last_name}`.trim()
        : 'Unknown user';

    const isInitialLoading = messages === undefined;

    return (
        <AdminLayout title={`Chat — ${chat.title}`}>
            <Head title={`${chat.title} — Chat`} />

            <div className="space-y-8 pb-12">
                {/* Header */}
                <section className="relative overflow-hidden rounded-2xl border bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-violet-100/80 dark:bg-violet-900/20 blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-blue-100/70 dark:bg-blue-900/20 blur-3xl" />
                    <div className="relative space-y-4">
                        <Link
                            href="/chats"
                            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to chats
                        </Link>
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 mb-1">
                                    Chat thread
                                </p>
                                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">{chat.title}</h1>
                                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                    <div className="flex items-center gap-1.5">
                                        <User className="h-4 w-4" />
                                        <span className="font-medium text-slate-900 dark:text-slate-200">{ownerName}</span>
                                    </div>
                                    <span>&bull;</span>
                                    <span>{chat.messages_count} message{chat.messages_count !== 1 ? 's' : ''}</span>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Button
                                    variant="destructive"
                                    className="gap-2 shadow-sm"
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
                    <div className="flex items-start justify-between gap-3 rounded-md border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
                        <span>{flash.success}</span>
                        <button onClick={() => setDismissedSuccess(flash?.success ?? null)} className="rounded p-1 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : null}

                {/* Meta cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                        <CardHeader className="space-y-1 pb-4">
                            <CardDescription className="font-medium">Status</CardDescription>
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
                    <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                        <CardHeader className="space-y-1 pb-4">
                            <CardDescription className="font-medium">User</CardDescription>
                            <div className="flex items-center gap-3 pt-1">
                                {chat.user?.avatar ? (
                                    <img
                                        src={chat.user.avatar}
                                        alt={ownerName}
                                        className="h-10 w-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                                    />
                                ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold shadow-sm">
                                        {chat.user?.first_name?.charAt(0) || 'U'}
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-col">
                                        <CardTitle className="text-base text-slate-900 dark:text-white truncate">{ownerName}</CardTitle>
                                        {chat.user?.email && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{chat.user.email}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>
                    <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                        <CardHeader className="space-y-1 pb-4">
                            <CardDescription className="font-medium">HVAC Model Context</CardDescription>
                            {chat.hvac_model ? (
                                <div className="pt-1">
                                    <CardTitle className="text-base text-slate-900 dark:text-white truncate">{chat.hvac_model.name}</CardTitle>
                                    <div className="flex items-center justify-between mt-1">
                                        {chat.hvac_model.brand && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{chat.hvac_model.brand.name}</p>
                                        )}
                                        <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs text-indigo-600 dark:text-indigo-400">
                                            <Link href={`/hvac-models/${chat.hvac_model.slug}`}>View details &rarr;</Link>
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="pt-2">
                                    <CardTitle className="text-sm font-medium text-slate-400 dark:text-slate-500 italic">No specific model selected</CardTitle>
                                </div>
                            )}
                        </CardHeader>
                    </Card>
                </div>

                {/* Professional Messages Thread (Supports Dynamic Fullscreen Mode) */}
                {isChatFullscreen && (
                    <style>{`
                        header, aside { display: none !important; }
                        main { margin: 0 !important; padding: 0 !important; max-width: 100% !important; z-index: 9999 !important; }
                    `}</style>
                )}
                <Card className={`border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm flex flex-col overflow-hidden transition-all duration-200 ${
                    isChatFullscreen ? 'fixed inset-0 z-50 h-screen w-screen m-0 rounded-none border-none' : ''
                }`}>
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/20 px-6 py-4 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
                            <Bot className="h-5 w-5 text-indigo-500" />
                            Conversation History
                        </CardTitle>
                        
                        {/* Fullscreen Toggle Button */}
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsChatFullscreen(!isChatFullscreen)}
                            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 h-9 w-9"
                        >
                            {isChatFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                        </Button>
                    </CardHeader>
                    <CardContent className={`p-0 ${isChatFullscreen ? 'flex-1 flex flex-col min-h-0' : ''}`}>
                        <div 
                            ref={chatContainerRef}
                            className={`flex flex-col space-y-6 p-6 overflow-y-auto scroll-smooth bg-slate-50/30 dark:bg-[#0f172a]/20 ${
                                isChatFullscreen ? 'flex-1 h-full' : 'h-[600px]'
                            }`}
                        >
                            {isInitialLoading ? (
                                <div className="space-y-6">
                                    <div className="flex w-full justify-end">
                                        <div className="h-16 w-2/3 animate-pulse rounded-2xl rounded-tr-sm bg-slate-200 dark:bg-slate-800" />
                                    </div>
                                    <div className="flex w-full justify-start">
                                        <div className="flex gap-3 w-2/3">
                                            <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                                            <div className="h-24 w-full animate-pulse rounded-2xl rounded-tl-sm bg-slate-200 dark:bg-slate-800" />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {messages?.length ? (
                                        messages.map((msg, index) => {
                                            const isUser = msg.sender_role === 'user';
                                            const isSystem = msg.sender_role === 'system';
                                            const isAssistant = msg.sender_role === 'assistant';

                                            const currentMsgDate = new Date(msg.created_at).toDateString();
                                            const prevMsgDate = index > 0 ? new Date(messages[index - 1].created_at).toDateString() : null;
                                            const showDateSeparator = currentMsgDate !== prevMsgDate;

                                            return (
                                                <div key={msg.id} className="flex flex-col w-full">
                                                    {showDateSeparator && (
                                                        <div className="flex justify-center mb-6 mt-2">
                                                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs px-3 py-1 rounded-full font-medium">
                                                                {new Date(msg.created_at).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {isSystem && (
                                                        <div className="flex justify-center my-2">
                                                            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 text-amber-800 dark:text-amber-400 text-xs px-4 py-2 rounded-lg max-w-[80%] text-center shadow-sm">
                                                                {msg.content}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {!isSystem && (
                                                        <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} group mb-2`}>
                                                            <div className={`flex max-w-[85%] lg:max-w-[75%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                                                                
                                                                {/* Avatar */}
                                                                <div className="flex-shrink-0 mt-auto hidden sm:block">
                                                                    {isAssistant ? (
                                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-200 dark:border-indigo-800">
                                                                            <Bot className="h-5 w-5" />
                                                                        </div>
                                                                    ) : (
                                                                        msg.sender?.avatar ? (
                                                                            <img
                                                                                src={msg.sender.avatar}
                                                                                alt={msg.sender.first_name || 'User'}
                                                                                className="h-8 w-8 rounded-full object-cover shadow-sm border border-slate-200 dark:border-slate-700"
                                                                            />
                                                                        ) : (
                                                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-300 dark:border-slate-700">
                                                                                <User className="h-4 w-4" />
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </div>

                                                                {/* Message Bubble Container */}
                                                                <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} min-w-0`}>
                                                                    {!isUser && (
                                                                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 ml-1">
                                                                            {isAssistant ? 'AI Assistant' : msg.sender ? `${msg.sender.first_name} ${msg.sender.last_name}` : 'Unknown'}
                                                                        </span>
                                                                    )}

                                                                    {/* Bubble */}
                                                                    <div 
                                                                        className={`relative px-5 py-3.5 shadow-sm text-[15px] leading-relaxed break-words
                                                                            ${isUser 
                                                                                ? 'bg-[#1a73e8] dark:bg-blue-600 text-white rounded-2xl rounded-br-sm' 
                                                                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-2xl rounded-bl-sm'
                                                                            }`}
                                                                    >
                                                                        <p className="whitespace-pre-wrap">{msg.content}</p>

                                                                        {/* Attachments */}
                                                                        {msg.attachments && msg.attachments.length > 0 && (
                                                                            <div className="mt-3 grid gap-2 grid-cols-1 sm:grid-cols-2">
                                                                                {msg.attachments.map((attachment, idx) => {
                                                                                    const isImage = attachment.mimeType.startsWith('image/');
                                                                                    const isVideo = attachment.mimeType.startsWith('video/');

                                                                                    if (isImage) {
                                                                                        return (
                                                                                            <a href={attachment.url} target="_blank" rel="noreferrer" key={idx} className="block group/img relative overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
                                                                                                <img 
                                                                                                    src={attachment.url} 
                                                                                                    alt={attachment.name} 
                                                                                                    className="max-h-48 w-full object-cover transition-transform duration-300 group-hover/img:scale-105 bg-white dark:bg-black/50" 
                                                                                                />
                                                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                                                                    <Eye className="text-white h-6 w-6" />
                                                                                                </div>
                                                                                            </a>
                                                                                        );
                                                                                    }

                                                                                    if (isVideo) {
                                                                                        return (
                                                                                            <video 
                                                                                                key={idx} 
                                                                                                src={attachment.url} 
                                                                                                controls 
                                                                                                className="max-h-48 w-full rounded-lg border border-black/10 dark:border-white/10 bg-black" 
                                                                                            />
                                                                                        );
                                                                                    }

                                                                                    return (
                                                                                        <button
                                                                                            key={idx}
                                                                                            type="button"
                                                                                            onClick={() => setDownloadTarget(attachment)}
                                                                                            className={`flex items-center gap-3 rounded-lg border p-2 text-left transition-colors w-full overflow-hidden ${
                                                                                                isUser 
                                                                                                    ? 'border-blue-400 bg-blue-700/40 hover:bg-blue-700/60' 
                                                                                                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                                                            }`}
                                                                                        >
                                                                                            <div className={`p-2 rounded-md ${isUser ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-800'}`}>
                                                                                                <FileText className={`h-4 w-4 ${isUser ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`} />
                                                                                            </div>
                                                                                            <div className="flex-1 min-w-0">
                                                                                                <p className="truncate text-sm font-medium">{attachment.name}</p>
                                                                                                <p className={`text-xs ${isUser ? 'text-blue-200' : 'text-slate-500 dark:text-slate-400'}`}>
                                                                                                    {Math.round(attachment.size / 1024)} KB
                                                                                                </p>
                                                                                            </div>
                                                                                            <Download className={`h-4 w-4 shrink-0 mx-1 ${isUser ? 'text-blue-200' : 'text-slate-400'}`} />
                                                                                        </button>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Timestamp */}
                                                                    <div className={`flex items-center gap-1 mt-1 ${isUser ? 'mr-1 justify-end' : 'ml-1 justify-start'}`}>
                                                                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                                                                            {formatTime(msg.created_at)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 space-y-3">
                                            <Bot className="h-12 w-12 opacity-20" />
                                            <p className="text-sm font-medium">No messages in this chat yet.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Delete chat dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-lg dark:bg-slate-900 dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="dark:text-white">Delete chat</DialogTitle>
                        <DialogDescription className="dark:text-slate-400">
                            Permanently remove this chat and all its messages.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="rounded-lg border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 px-4 py-3 text-sm text-rose-900 dark:text-rose-400">
                        You are about to delete <strong className="font-semibold">"{chat.title}"</strong>. This action cannot be undone.
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="dark:border-slate-700 dark:hover:bg-slate-800">
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            Delete chat
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Download Attachment Dialog */}
            <Dialog open={!!downloadTarget} onOpenChange={(open) => !open && setDownloadTarget(null)}>
                <DialogContent className="sm:max-w-md dark:bg-slate-900 dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="dark:text-white">Download Attachment</DialogTitle>
                        <DialogDescription className="dark:text-slate-400">
                            Would you like to download this file?
                        </DialogDescription>
                    </DialogHeader>
                    {downloadTarget && (
                        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 break-all flex items-center gap-3">
                            <FileText className="h-5 w-5 text-indigo-500 shrink-0" />
                            <strong className="font-medium">{downloadTarget.name}</strong>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDownloadTarget(null)} className="dark:border-slate-700 dark:hover:bg-slate-800">
                            Cancel
                        </Button>
                        {downloadTarget && (
                            <Button asChild className="gap-2">
                                <a 
                                    href={downloadTarget.url} 
                                    download={downloadTarget.name}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={() => setDownloadTarget(null)}
                                >
                                    <Download className="h-4 w-4" />
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