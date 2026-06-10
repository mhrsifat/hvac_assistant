import { Deferred, Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Eye, Plus, Sparkles, Trash2, Upload, X, AlertCircle, FileText } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
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

type BrandInfo = {
    id: number;
    name: string;
    slug: string;
    logo_path: string | null;
};

type HvacModelDetail = {
    id: number;
    name: string;
    slug: string;
    model_number: string | null;
    capacity_btu: number | null;
    efficiency_rating: string | null;
    power_spec: string | null;
    refrigerant_type: string | null;
    image_path: string | null;
    documents_count: number;
    error_codes_count: number;
    brand?: BrandInfo | null;
};

type SupportDocument = {
    id: number;
    original_name: string;
    file_path: string;
    mime_type: string;
    file_size: number;
    ai_fed: boolean;
    is_processing?: boolean;
    ai_feed_error: { message?: string; type?: string } | null;
};

type ErrorCode = {
    id: number;
    code: string;
    description: string;
    resolution_steps: string;
};

type HvacModelShowProps = {
    model: HvacModelDetail;
    documents?: SupportDocument[];
    errorCodes?: ErrorCode[];
    flash?: {
        success?: string;
        error?: string;
    };
};

const formatFileSize = (size: number): string => {
    if (!Number.isFinite(size) || size <= 0) {
        return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB'];
    let index = 0;
    let value = size;

    while (value >= 1024 && index < units.length - 1) {
        value /= 1024;
        index++;
    }

    const precision = value >= 10 || index === 0 ? 0 : 1;

    return `${value.toFixed(precision)} ${units[index]}`;
};

export default function HvacModelShow() {
    const { model, documents, errorCodes, flash } = usePage<HvacModelShowProps>().props;
    const [isDocumentOpen, setIsDocumentOpen] = useState(false);
    const [isErrorCodeOpen, setIsErrorCodeOpen] = useState(false);
    const [isDeleteModelOpen, setIsDeleteModelOpen] = useState(false);
    const [isDeleteDocOpen, setIsDeleteDocOpen] = useState(false);
    const [deleteDocTarget, setDeleteDocTarget] = useState<SupportDocument | null>(null);
    const [isDeleteEcOpen, setIsDeleteEcOpen] = useState(false);
    const [deleteEcTarget, setDeleteEcTarget] = useState<ErrorCode | null>(null);
    const [isFeedOpen, setIsFeedOpen] = useState(false);
    const [feedTarget, setFeedTarget] = useState<SupportDocument | null>(null);
    const [expandedErrorDocId, setExpandedErrorDocId] = useState<number | null>(null);

    // Upload modal state
    const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
    const [showUploadErrorDialog, setShowUploadErrorDialog] = useState(false);
    const [fullUploadErrorText, setFullUploadErrorText] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const documentForm = useForm<{ documents: File[] }>({ documents: [] });
    const errorCodeForm = useForm({ code: '', description: '', resolution_steps: '' });

    const [dismissedSuccess, setDismissedSuccess] = useState<string | null>(null);
    const [dismissedError, setDismissedError] = useState<string | null>(null);
    const showSuccess = Boolean(flash?.success) && flash?.success !== dismissedSuccess;
    const showError = Boolean(flash?.error) && flash?.error !== dismissedError;

    // 100% Seamless Silent Polling Every 5 Seconds (No WebSockets)
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({
                only: ['documents'], // Only fetch documents silently to update processing status
                preserveState: true,
                preserveScroll: true,
                showProgress: false, // Prevents the blue loading bar at the top
            });
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    // Drag & drop handlers
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const files = Array.from(e.dataTransfer.files);

        if (files.length) {
            documentForm.setData('documents', [...documentForm.data.documents, ...files]);
        }
    };
    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        if (files.length) {
            documentForm.setData('documents', [...documentForm.data.documents, ...files]);
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const submitDocument = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        documentForm.post(`/hvac-models/${model.slug}/documents`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                documentForm.reset();
                setUploadErrors({});
                setIsDocumentOpen(false);
            },
            onError: (errors) => {
                const fileErrors: Record<string, string> = {};
                const errorEntries = Object.entries(errors);
                errorEntries.forEach(([key, value]) => {
                    if (key.startsWith('documents')) {
                        const match = key.match(/\.(\d+)$/);

                        if (match) {
                            const idx = parseInt(match[1], 10);
                            const fileName = documentForm.data.documents[idx]?.name || `File ${idx + 1}`;
                            fileErrors[fileName] = value as string;
                        } else {
                            fileErrors['Upload error'] = value as string;
                        }
                    }
                });
                setUploadErrors(fileErrors);

                if (Object.keys(fileErrors).length) {
                    const errorText = Object.entries(fileErrors).map(([f, e]) => `${f}: ${e}`).join('\n');
                    setFullUploadErrorText(errorText);
                    setShowUploadErrorDialog(true);
                }
            },
        });
    };

    const removeFile = (index: number) => {
        const newDocs = [...documentForm.data.documents];
        const removedFileName = documentForm.data.documents[index]?.name;
        newDocs.splice(index, 1);
        documentForm.setData('documents', newDocs);

        if (removedFileName && uploadErrors[removedFileName]) {
            const newErrors = { ...uploadErrors };
            delete newErrors[removedFileName];
            setUploadErrors(newErrors);
        }
    };

    const submitErrorCode = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        errorCodeForm.post(`/hvac-models/${model.slug}/error-codes`, {
            preserveScroll: true,
            onSuccess: () => {
                errorCodeForm.reset();
                setIsErrorCodeOpen(false);
            },
        });
    };

    const confirmDeleteModel = (): void => {
        router.delete(`/hvac-models/${model.slug}`, {
            onSuccess: () => setIsDeleteModelOpen(false),
        });
    };

    const openDeleteDoc = (doc: SupportDocument): void => {
        setDeleteDocTarget(doc);
        setIsDeleteDocOpen(true);
    };

    const confirmDeleteDoc = (): void => {
        if (!deleteDocTarget) {
            return;
        }

        router.delete(`/hvac-models/${model.slug}/documents/${deleteDocTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteDocOpen(false);
                setDeleteDocTarget(null);
            },
        });
    };

    const openDeleteEc = (ec: ErrorCode): void => {
        setDeleteEcTarget(ec);
        setIsDeleteEcOpen(true);
    };

    const confirmDeleteEc = (): void => {
        if (!deleteEcTarget) {
            return;
        }

        router.delete(`/hvac-models/${model.slug}/error-codes/${deleteEcTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteEcOpen(false);
                setDeleteEcTarget(null);
            },
        });
    };

    const openFeedModal = (doc: SupportDocument): void => {
        setFeedTarget(doc);
        setIsFeedOpen(true);
    };

    const confirmFeed = (): void => {
        if (!feedTarget) {
return;
}

        router.post(`/hvac-models/${model.slug}/documents/${feedTarget.id}/feed`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setIsFeedOpen(false);
                setFeedTarget(null);
            },
        });
    };

    // === রেন্ডার ফাংশন: কোড পরিষ্কার রাখার জন্য এবং Deferred বাইপাস করার জন্য ===
    const renderDocuments = () => (
        <div className="space-y-3">
            {documents?.length ? (
                documents.map((doc) => (
                    <div
                        key={doc.id}
                        className="flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                    {doc.original_name}
                                </p>
                                {doc.is_processing ? (
                                    <Badge className="bg-amber-500">Processing...</Badge>
                                ) : doc.ai_fed ? (
                                    <Badge className="bg-emerald-600">Fed to AI</Badge>
                                ) : doc.ai_feed_error ? (
                                    <Badge variant="destructive">Feed failed</Badge>
                                ) : (
                                    <Badge variant="secondary">Not fed</Badge>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {doc.mime_type} — {formatFileSize(doc.file_size)}
                            </p>
                            {doc.ai_feed_error?.message && (
                                <div className="mt-1 text-xs">
                                    {expandedErrorDocId === doc.id ? (
                                        <div className="rounded bg-rose-50 p-2 text-rose-800">
                                            <p className="whitespace-pre-wrap break-all">{doc.ai_feed_error.message}</p>
                                            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setExpandedErrorDocId(null)}>Show less</Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="truncate text-rose-600">
                                                {doc.ai_feed_error.message.slice(0, 100)}
                                                {doc.ai_feed_error.message.length > 100 ? '…' : ''}
                                            </span>
                                            {doc.ai_feed_error.message.length > 100 && (
                                                <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setExpandedErrorDocId(doc.id)}>Show full error</Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button asChild variant="outline" size="sm">
                                <a
                                    href={doc.file_path}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="gap-2"
                                >
                                    <Eye className="h-4 w-4" />
                                    View
                                </a>
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2" onClick={() => openFeedModal(doc)} disabled={(doc.ai_fed && !doc.ai_feed_error) || doc.is_processing}>
                                <Sparkles className="h-4 w-4" />Feed to AI
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => openDeleteDoc(doc)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    No model documents uploaded yet.
                </p>
            )}
        </div>
    );

    const renderErrorCodes = () => (
        <div className="space-y-3">
            {errorCodes?.length ? (
                errorCodes.map((ec) => (
                    <div
                        key={ec.id}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-2">
                                <Badge variant="outline">{ec.code}</Badge>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                    {ec.description}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteEc(ec)}
                            >
                                <Trash2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                            </Button>
                        </div>
                        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{ec.resolution_steps}</p>
                    </div>
                ))
            ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">No model error codes yet.</p>
            )}
        </div>
    );

    return (
        <AdminLayout title={`Model — ${model.name}`}>
            <Head title={`${model.name} — HVAC Model`} />

            <div className="space-y-8">
                {/* Header */}
                <section className="relative overflow-hidden rounded-2xl border bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-sky-100/80 blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-indigo-100/70 blur-3xl" />
                    <div className="relative space-y-4">
                        <Link
                            href="/hvac-models"
                            className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to models
                        </Link>
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-4">
                                {model.image_path ? (
                                    <img
                                        src={model.image_path}
                                        alt={model.name}
                                        className="h-16 w-16 rounded-2xl object-cover ring-1 ring-slate-200 dark:ring-slate-800"
                                    />
                                ) : (
                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-lg font-semibold text-slate-500 dark:text-slate-400">
                                        {model.name.slice(0, 2).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                                        HVAC model
                                    </p>
                                    <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                                        {model.name}
                                    </h1>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                        {model.brand?.name ?? 'Brand'} — Model-specific documents and error codes.
                                    </p>
                                </div>
                            </div>
                             <div className="flex flex-wrap gap-3">
                                {/* UPLOAD MODAL - Drag & Drop, Compact */}
                                <Dialog open={isDocumentOpen} onOpenChange={(open) => {
                                    setIsDocumentOpen(open);

                                    if (!open) {
                                        setUploadErrors({});
                                    }
                                }}>
                                    <DialogTrigger asChild>
                                        <Button className="gap-2"><Upload className="h-4 w-4" />Upload document</Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-lg">
                                        <DialogHeader>
                                            <DialogTitle>Upload model documents</DialogTitle>
                                            <DialogDescription>Drag & drop files or click to select.</DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={submitDocument} className="space-y-4">
                                            <div
                                                className={`relative flex min-h-[100px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${dragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-300 bg-slate-50 dark:bg-slate-800/50'} hover:border-indigo-400`}
                                                onDragEnter={handleDrag}
                                                onDragLeave={handleDrag}
                                                onDragOver={handleDrag}
                                                onDrop={handleDrop}
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <Upload className="mb-1 h-8 w-8 text-slate-400" />
                                                <p className="text-sm text-slate-600 dark:text-slate-300">Drag files here or click to browse</p>
                                                <p className="text-xs text-slate-400">PDF, DOCX, XLSX, CSV, TXT, images</p>
                                                <Input type="file" multiple accept=".pdf,.docx,.xlsx,.csv,.txt,image/*" ref={fileInputRef} onChange={handleFileInput} className="hidden" />
                                            </div>

                                            {documentForm.data.documents.length > 0 && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                            {documentForm.data.documents.length} file(s) selected
                                                        </label>
                                                        <Button type="button" variant="ghost" size="sm" onClick={() => {
                                                            documentForm.setData('documents', []); setUploadErrors({});
                                                        }} className="h-7 gap-1 text-xs text-red-600">
                                                            <X className="h-3 w-3" />Clear all
                                                        </Button>
                                                    </div>
                                                    <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-md border p-2">
                                                        {documentForm.data.documents.map((file, idx) => (
                                                            <div key={idx} className="flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs">
                                                                <FileText className="h-3 w-3 text-slate-500 dark:bg-slate-400" />
                                                                <span className="max-w-[150px] truncate">{file.name}</span>
                                                                <span className="text-slate-400">{formatFileSize(file.size)}</span>
                                                                {uploadErrors[file.name] && <AlertCircle className="h-3 w-3 text-amber-600" title={uploadErrors[file.name]} />}
                                                                <button type="button" onClick={() => removeFile(idx)} className="ml-1 rounded-full p-0.5 hover:bg-slate-200"><X className="h-3 w-3" /></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {Object.keys(uploadErrors).length > 0 && (
                                                <div className="rounded-md border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-2 text-sm text-amber-800">
                                                    <div className="flex items-center justify-between">
                                                        <span>{Object.keys(uploadErrors).length} file(s) failed validation.</span>
                                                        <Button type="button" variant="ghost" size="sm" onClick={() => setShowUploadErrorDialog(true)}>Show details</Button>
                                                    </div>
                                                </div>
                                            )}

                                            <DialogFooter>
                                                <Button type="button" variant="outline" onClick={() => setIsDocumentOpen(false)}>Cancel</Button>
                                                <Button type="submit" disabled={documentForm.processing || documentForm.data.documents.length === 0}>
                                                    {documentForm.processing ? 'Uploading...' : `Upload ${documentForm.data.documents.length} file(s)`}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>

                                {/* Upload error details dialog */}
                                <Dialog open={showUploadErrorDialog} onOpenChange={setShowUploadErrorDialog}>
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader><DialogTitle>Upload errors</DialogTitle><DialogDescription>Details why some files were rejected.</DialogDescription></DialogHeader>
                                        <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded bg-slate-100 dark:bg-slate-800 p-3 text-xs">{fullUploadErrorText}</pre>
                                        <DialogFooter><Button onClick={() => setShowUploadErrorDialog(false)}>Close</Button></DialogFooter>
                                    </DialogContent>
                                </Dialog>
                                <Dialog open={isErrorCodeOpen} onOpenChange={setIsErrorCodeOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="gap-2">
                                            <Plus className="h-4 w-4" />
                                            Add error code
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-lg">
                                        <DialogHeader>
                                            <DialogTitle>Add model error code</DialogTitle>
                                            <DialogDescription>
                                                Document model-specific errors and exact fix steps.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={submitErrorCode} className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Error code</label>
                                                <Input
                                                    value={errorCodeForm.data.code}
                                                    onChange={(e) => errorCodeForm.setData('code', e.target.value)}
                                                    placeholder="E03"
                                                    className={errorCodeForm.errors.code ? 'border-red-500' : ''}
                                                />
                                                {errorCodeForm.errors.code && (
                                                    <span className="text-xs text-red-500">
                                                        {errorCodeForm.errors.code}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                                                <textarea
                                                    value={errorCodeForm.data.description}
                                                    onChange={(e) =>
                                                        errorCodeForm.setData('description', e.target.value)
                                                    }
                                                    className={`min-h-[90px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none ${errorCodeForm.errors.description ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'}`}
                                                    placeholder="What the code indicates"
                                                />
                                                {errorCodeForm.errors.description && (
                                                    <span className="text-xs text-red-500">
                                                        {errorCodeForm.errors.description}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    Resolution steps
                                                </label>
                                                <textarea
                                                    value={errorCodeForm.data.resolution_steps}
                                                    onChange={(e) =>
                                                        errorCodeForm.setData('resolution_steps', e.target.value)
                                                    }
                                                    className={`min-h-[110px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none ${errorCodeForm.errors.resolution_steps ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'}`}
                                                    placeholder="Step-by-step resolution plan"
                                                />
                                                {errorCodeForm.errors.resolution_steps && (
                                                    <span className="text-xs text-red-500">
                                                        {errorCodeForm.errors.resolution_steps}
                                                    </span>
                                                )}
                                            </div>
                                            <DialogFooter>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setIsErrorCodeOpen(false)}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button type="submit" disabled={errorCodeForm.processing}>
                                                    {errorCodeForm.processing ? 'Saving...' : 'Save error code'}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>

                                <Button
                                    variant="destructive"
                                    className="gap-2"
                                    onClick={() => setIsDeleteModelOpen(true)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete model
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Flash messages */}
                {flash?.success && showSuccess ? (
                    <div className="flex items-start justify-between gap-3 rounded-md border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
                        <span>{flash.success}</span>
                        <button onClick={() => setDismissedSuccess(flash?.success ?? null)} className="rounded p-1">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : null}

                {flash?.error && showError ? (
                    <div className="flex items-start justify-between gap-3 rounded-md border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400">
                        <span>{flash.error}</span>
                        <button onClick={() => setDismissedError(flash?.error ?? null)} className="rounded p-1">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : null}

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="space-y-1">
                            <CardDescription>Documents</CardDescription>
                            <CardTitle className="text-3xl text-slate-900 dark:text-white">{model.documents_count}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="space-y-1">
                            <CardDescription>Error codes</CardDescription>
                            <CardTitle className="text-3xl text-slate-900 dark:text-white">{model.error_codes_count}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="space-y-1">
                            <CardDescription>Brand</CardDescription>
                            <CardTitle className="text-xl text-slate-900 dark:text-white">{model.brand?.name ?? '—'}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Specs */}
                <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
                    <Card className="border-0 bg-white dark:bg-slate-900/90 shadow-sm">
                        <CardHeader className="space-y-1">
                            <CardTitle className="text-base">Model details</CardTitle>
                            <CardDescription>Core specs that technicians reference during diagnostics.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 text-sm sm:grid-cols-2">
                                {[
                                    { label: 'Model number', value: model.model_number ?? '—' },
                                    {
                                        label: 'Capacity',
                                        value: model.capacity_btu
                                            ? `${model.capacity_btu.toLocaleString()} BTU`
                                            : '—',
                                    },
                                    { label: 'Efficiency', value: model.efficiency_rating ?? '—' },
                                    { label: 'Power spec', value: model.power_spec ?? '—' },
                                    { label: 'Refrigerant', value: model.refrigerant_type ?? '—' },
                                ].map(({ label, value }) => (
                                    <div key={label}>
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
                                        <p className="font-semibold text-slate-900 dark:text-white">{value}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 bg-white dark:bg-slate-900/90 shadow-sm">
                        <CardHeader className="space-y-1">
                            <CardTitle className="text-base">Brand profile</CardTitle>
                            <CardDescription>
                                Shared assets and error codes live under the brand page.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                {model.brand?.logo_path ? (
                                    <img
                                        src={model.brand.logo_path}
                                        alt={model.brand.name}
                                        className="h-10 w-10 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-800"
                                    />
                                ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        {model.brand?.name ? model.brand.name.slice(0, 2).toUpperCase() : 'BR'}
                                    </div>
                                )}
                                <div>
                                    <p className="font-semibold text-slate-900 dark:text-white">{model.brand?.name ?? 'Brand'}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Shared resources and error codes</p>
                                </div>
                            </div>
                            {model.brand ? (
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`/brands/${model.brand.slug}`} className="gap-2">
                                        <Eye className="h-4 w-4" />
                                        View brand
                                    </Link>
                                </Button>
                            ) : null}
                        </CardContent>
                    </Card>
                </div>

                {/* Documents + Error codes */}
                <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                    <Card className="border-0 bg-white dark:bg-slate-900/90 shadow-sm">
                        <CardHeader className="space-y-1">
                            <CardTitle className="text-base">Model documents</CardTitle>
                            <CardDescription>Documentation specific to this model.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* শুধুমাত্র প্রথমবার লোড হওয়ার সময় Deferred ব্যবহার হবে */}
                            {documents === undefined ? (
                                <Deferred
                                    data="documents"
                                    fallback={
                                        <div className="space-y-3">
                                            <div className="h-12 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
                                            <div className="h-12 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
                                        </div>
                                    }
                                >
                                    {() => renderDocuments()}
                                </Deferred>
                            ) : (
                                // ডেটা চলে আসার পর সরাসরি রেন্ডার হবে (তাই পোলিং-এর সময় ব্লিঙ্ক করবে না)
                                renderDocuments()
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-0 bg-white dark:bg-slate-900/90 shadow-sm">
                        <CardHeader className="space-y-1">
                            <CardTitle className="text-base">Model error codes</CardTitle>
                            <CardDescription>Errors that apply only to this model.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {errorCodes === undefined ? (
                                <Deferred
                                    data="errorCodes"
                                    fallback={
                                        <div className="space-y-3">
                                            <div className="h-16 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
                                            <div className="h-16 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
                                        </div>
                                    }
                                >
                                    {() => renderErrorCodes()}
                                </Deferred>
                            ) : (
                                renderErrorCodes()
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Delete model dialog */}
            <Dialog open={isDeleteModelOpen} onOpenChange={setIsDeleteModelOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Delete model</DialogTitle>
                        <DialogDescription>
                            Permanently remove this model and all its associated data.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                        You are about to delete <strong>{model.name}</strong> and all associated documents and error
                        codes.
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteModelOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDeleteModel}>
                            Delete model
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Feed document dialog */}
            <Dialog open={isFeedOpen} onOpenChange={(open) => {
                setIsFeedOpen(open);

                if (!open) {
setFeedTarget(null);
}
            }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Feed document to AI</DialogTitle>
                        <DialogDescription>Extract text from this document and store it in the vector database.</DialogDescription>
                    </DialogHeader>
                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                        {feedTarget?.original_name ?? 'Selected document'}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsFeedOpen(false)}>Cancel</Button>
                        <Button onClick={confirmFeed} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"><Sparkles className="h-4 w-4" />Feed to AI</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete document dialog */}
            <Dialog
                open={isDeleteDocOpen}
                onOpenChange={(open) => {
                    setIsDeleteDocOpen(open);

                    if (!open) {
                        setDeleteDocTarget(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Delete document</DialogTitle>
                        <DialogDescription>Permanently remove this document.</DialogDescription>
                    </DialogHeader>
                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                        {deleteDocTarget?.original_name ?? 'Selected document'}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDocOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDeleteDoc}>
                            Delete document
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete error code dialog */}
            <Dialog
                open={isDeleteEcOpen}
                onOpenChange={(open) => {
                    setIsDeleteEcOpen(open);

                    if (!open) {
                        setDeleteEcTarget(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Delete error code</DialogTitle>
                        <DialogDescription>Permanently remove this error code entry.</DialogDescription>
                    </DialogHeader>
                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                        {deleteEcTarget?.code ?? 'Selected error code'}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteEcOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDeleteEc}>
                            Delete error code
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}