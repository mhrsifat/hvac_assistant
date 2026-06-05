import { Deferred, Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Eye, Plus, Sparkles, Trash2, Upload, X, AlertCircle, FileText } from 'lucide-react';
import type { FormEvent} from 'react';
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

type Brand = {
  id: number;
  name: string;
  logo_path: string | null;
  created_at: string;
  hvac_models_count: number;
  documents_count: number;
  error_codes_count: number;
};

type SupportDocument = {
  id: number;
  original_name: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  created_at: string;
  ai_fed: boolean;
  ai_feed_error: { message?: string; type?: string } | null;
};

type ErrorCode = {
  id: number;
  code: string;
  description: string;
  resolution_steps: string;
};

type HvacModelSummary = {
  id: number;
  name: string;
  model_number: string | null;
  capacity_btu: number | null;
  documents_count?: number;
  error_codes_count?: number;
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

type BrandShowProps = {
  brand: Brand;
  documents?: SupportDocument[];
  errorCodes?: PaginatedResponse<ErrorCode>;
  models?: PaginatedResponse<HvacModelSummary>;
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

export default function BrandShow() {
  const { brand, documents, errorCodes, models, flash } = usePage<BrandShowProps>().props;
  const [showSuccess, setShowSuccess] = useState(Boolean(flash?.success));
  const [showError, setShowError] = useState(Boolean(flash?.error));
  const [isDocumentOpen, setIsDocumentOpen] = useState(false);
  const [isErrorCodeOpen, setIsErrorCodeOpen] = useState(false);
  const [isFeedOpen, setIsFeedOpen] = useState(false);
  const [feedTarget, setFeedTarget] = useState<SupportDocument | null>(null);
  const [isDeleteBrandOpen, setIsDeleteBrandOpen] = useState(false);
  const [isDeleteDocumentOpen, setIsDeleteDocumentOpen] = useState(false);
  const [deleteDocumentTarget, setDeleteDocumentTarget] = useState<SupportDocument | null>(null);
  const [isDeleteErrorCodeOpen, setIsDeleteErrorCodeOpen] = useState(false);
  const [deleteErrorCodeTarget, setDeleteErrorCodeTarget] = useState<ErrorCode | null>(null);

  // Upload modal state
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [showUploadErrorDialog, setShowUploadErrorDialog] = useState(false);
  const [fullUploadErrorText, setFullUploadErrorText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Document list error expansion state
  const [expandedErrorDocId, setExpandedErrorDocId] = useState<number | null>(null);

  const documentForm = useForm<{ documents: File[] }>({ documents: [] });
  const errorCodeForm = useForm({
    code: '',
    description: '',
    resolution_steps: '',
  });

  useEffect(() => {
    setShowSuccess(Boolean(flash?.success));
  }, [flash?.success]);
  useEffect(() => {
    setShowError(Boolean(flash?.error));
  }, [flash?.error]);

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
    documentForm.post(`/brands/${brand.id}/documents`, {
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

  const submitErrorCode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    errorCodeForm.post(`/brands/${brand.id}/error-codes`, {
      preserveScroll: true,
      onSuccess: () => {
        errorCodeForm.reset();
        setIsErrorCodeOpen(false);
      },
    });
  };

  const openDeleteBrandModal = () => setIsDeleteBrandOpen(true);
  const confirmDeleteBrand = () => router.delete(`/brands/${brand.id}`, { preserveScroll: true, onSuccess: () => setIsDeleteBrandOpen(false) });
  const openDeleteDocumentModal = (doc: SupportDocument) => {
 setDeleteDocumentTarget(doc); setIsDeleteDocumentOpen(true); 
};
  const confirmDeleteDocument = () => {
    if (!deleteDocumentTarget) {
return;
}

    router.delete(`/brands/${brand.id}/documents/${deleteDocumentTarget.id}`, { preserveScroll: true, onSuccess: () => {
 setIsDeleteDocumentOpen(false); setDeleteDocumentTarget(null); 
} });
  };
  const openFeedModal = (doc: SupportDocument) => {
 setFeedTarget(doc); setIsFeedOpen(true); 
};
  const confirmFeed = () => {
    if (!feedTarget) {
return;
}

    router.post(`/brands/${brand.id}/documents/${feedTarget.id}/feed`, {}, { preserveScroll: true, onSuccess: () => {
 setIsFeedOpen(false); setFeedTarget(null); 
} });
  };
  const openDeleteErrorCodeModal = (ec: ErrorCode) => {
 setDeleteErrorCodeTarget(ec); setIsDeleteErrorCodeOpen(true); 
};
  const confirmDeleteErrorCode = () => {
    if (!deleteErrorCodeTarget) {
return;
}

    router.delete(`/brands/${brand.id}/error-codes/${deleteErrorCodeTarget.id}`, { preserveScroll: true, onSuccess: () => {
 setIsDeleteErrorCodeOpen(false); setDeleteErrorCodeTarget(null); 
} });
  };

  return (
    <AdminLayout title={`Brand - ${brand.name}`}>
      <Head title={`${brand.name} Brand`} />
      <div className="space-y-8">
        {/* Header section */}
        <section className="relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm">
          <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-indigo-100/80 blur-3xl" />
          <div className="absolute -left-24 -bottom-24 h-48 w-48 rounded-full bg-emerald-100/80 blur-3xl" />
          <div className="relative space-y-4">
            <Link href="/brands" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              Back to brands
            </Link>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                {brand.logo_path ? (
                  <img src={brand.logo_path} alt={brand.name} className="h-16 w-16 rounded-2xl object-cover ring-1 ring-slate-200" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-lg font-semibold text-slate-500">
                    {brand.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Brand profile</p>
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{brand.name}</h1>
                  <p className="text-sm text-slate-600">Shared documents and error code library for the brand.</p>
                  <p className="text-xs text-slate-500">Created {new Date(brand.created_at).toLocaleDateString()}</p>
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
                      <DialogTitle>Upload brand documents</DialogTitle>
                      <DialogDescription>Drag & drop files or click to select.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitDocument} className="space-y-4">
                      <div
                        className={`relative flex min-h-[100px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-slate-50'} hover:border-indigo-400`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="mb-1 h-8 w-8 text-slate-400" />
                        <p className="text-sm text-slate-600">Drag files here or click to browse</p>
                        <p className="text-xs text-slate-400">PDF, DOCX, XLSX, CSV, TXT, images</p>
                        <Input type="file" multiple accept=".pdf,.docx,.xlsx,.csv,.txt,image/*" ref={fileInputRef} onChange={handleFileInput} className="hidden" />
                      </div>

                      {documentForm.data.documents.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium uppercase tracking-wider text-slate-500">
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
                              <div key={idx} className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs">
                                <FileText className="h-3 w-3 text-slate-500" />
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
                        <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-sm text-amber-800">
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
                    <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded bg-slate-100 p-3 text-xs">{fullUploadErrorText}</pre>
                    <DialogFooter><Button onClick={() => setShowUploadErrorDialog(false)}>Close</Button></DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Feed AI modal */}
                <Dialog open={isFeedOpen} onOpenChange={(open) => {
 setIsFeedOpen(open);

 if (!open) {
setFeedTarget(null);
} 
}}>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader><DialogTitle>Feed document to AI</DialogTitle><DialogDescription>Process document and use AI tokens.</DialogDescription></DialogHeader>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      <div className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4" />Warning</div>
                      <p className="mt-1 text-sm">Feeding a document to AI will consume tokens and may take a few moments.</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{feedTarget?.original_name ?? 'Selected document'}</div>
                    <DialogFooter><Button variant="outline" onClick={() => setIsFeedOpen(false)}>Cancel</Button><Button onClick={confirmFeed}>Feed to AI</Button></DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Delete brand modal */}
                <Dialog open={isDeleteBrandOpen} onOpenChange={setIsDeleteBrandOpen}>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader><DialogTitle>Delete brand</DialogTitle><DialogDescription>Permanently remove brand and related data.</DialogDescription></DialogHeader>
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">You are about to delete {brand.name} and all associated models, documents, error codes.</div>
                    <DialogFooter><Button variant="outline" onClick={() => setIsDeleteBrandOpen(false)}>Cancel</Button><Button variant="destructive" onClick={confirmDeleteBrand}>Delete brand</Button></DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Delete document modal */}
                <Dialog open={isDeleteDocumentOpen} onOpenChange={(open) => {
 setIsDeleteDocumentOpen(open);

 if (!open) {
setDeleteDocumentTarget(null);
} 
}}>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader><DialogTitle>Delete document</DialogTitle><DialogDescription>Permanently remove document from brand.</DialogDescription></DialogHeader>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{deleteDocumentTarget?.original_name ?? 'Selected document'}</div>
                    <DialogFooter><Button variant="outline" onClick={() => setIsDeleteDocumentOpen(false)}>Cancel</Button><Button variant="destructive" onClick={confirmDeleteDocument}>Delete document</Button></DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Delete error code modal */}
                <Dialog open={isDeleteErrorCodeOpen} onOpenChange={(open) => {
 setIsDeleteErrorCodeOpen(open);

 if (!open) {
setDeleteErrorCodeTarget(null);
} 
}}>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader><DialogTitle>Delete error code</DialogTitle><DialogDescription>Permanently remove error code entry.</DialogDescription></DialogHeader>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{deleteErrorCodeTarget?.code ?? 'Selected error code'}</div>
                    <DialogFooter><Button variant="outline" onClick={() => setIsDeleteErrorCodeOpen(false)}>Cancel</Button><Button variant="destructive" onClick={confirmDeleteErrorCode}>Delete error code</Button></DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Add error code button */}
                <Dialog open={isErrorCodeOpen} onOpenChange={setIsErrorCodeOpen}>
                  <DialogTrigger asChild><Button variant="outline" className="gap-2"><Plus className="h-4 w-4" />Add error code</Button></DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader><DialogTitle>Add brand error code</DialogTitle><DialogDescription>Capture meaning and fix steps.</DialogDescription></DialogHeader>
                    <form onSubmit={submitErrorCode} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Error code</label>
                        <Input value={errorCodeForm.data.code} onChange={(e) => errorCodeForm.setData('code', e.target.value)} placeholder="E03" className={errorCodeForm.errors.code ? 'border-red-500' : ''} />
                        {errorCodeForm.errors.code && <span className="text-xs text-red-500">{errorCodeForm.errors.code}</span>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Description</label>
                        <textarea value={errorCodeForm.data.description} onChange={(e) => errorCodeForm.setData('description', e.target.value)} className={`min-h-[90px] w-full rounded-md border px-3 py-2 text-sm ${errorCodeForm.errors.description ? 'border-red-500' : 'border-slate-200'}`} placeholder="What the code indicates" />
                        {errorCodeForm.errors.description && <span className="text-xs text-red-500">{errorCodeForm.errors.description}</span>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Resolution steps</label>
                        <textarea value={errorCodeForm.data.resolution_steps} onChange={(e) => errorCodeForm.setData('resolution_steps', e.target.value)} className={`min-h-[110px] w-full rounded-md border px-3 py-2 text-sm ${errorCodeForm.errors.resolution_steps ? 'border-red-500' : 'border-slate-200'}`} placeholder="Step-by-step plan" />
                        {errorCodeForm.errors.resolution_steps && <span className="text-xs text-red-500">{errorCodeForm.errors.resolution_steps}</span>}
                      </div>
                      <DialogFooter><Button type="submit" disabled={errorCodeForm.processing}>{errorCodeForm.processing ? 'Saving...' : 'Save error code'}</Button></DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                <Button variant="destructive" className="gap-2" onClick={openDeleteBrandModal}><Trash2 className="h-4 w-4" />Delete brand</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Flash messages */}
        {flash?.success && showSuccess && (
          <div className="flex items-start justify-between gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <span>{flash.success}</span>
            <button onClick={() => setShowSuccess(false)} className="rounded p-1"><X className="h-4 w-4" /></button>
          </div>
        )}
        {flash?.error && showError && (
          <div className="flex items-start justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <span className="break-all">{flash.error}</span>
            <button onClick={() => setShowError(false)} className="rounded p-1"><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* Stats cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader><CardDescription>Total models</CardDescription><CardTitle className="text-3xl">{brand.hvac_models_count}</CardTitle></CardHeader></Card>
          <Card><CardHeader><CardDescription>Brand documents</CardDescription><CardTitle className="text-3xl">{brand.documents_count}</CardTitle></CardHeader></Card>
          <Card><CardHeader><CardDescription>Brand error codes</CardDescription><CardTitle className="text-3xl">{brand.error_codes_count}</CardTitle></CardHeader></Card>
        </div>

        {/* Brand documents section - fixed layout with buttons always top-right */}
        <div className="grid gap-6">
          <Card className="border-0 bg-white/90 shadow-sm">
            <CardHeader><CardTitle className="text-base">Brand documents</CardTitle><CardDescription>Manuals and guidance shared across every model.</CardDescription></CardHeader>
            <CardContent>
              <Deferred data="documents" fallback={<div className="space-y-3"><div className="h-12 animate-pulse rounded-md bg-slate-200" /><div className="h-12 animate-pulse rounded-md bg-slate-200" /></div>}>
                {() => (
                  <div className="space-y-3">
                    {documents?.length ? documents.map((doc) => (
                      <div key={doc.id} className="rounded-xl border border-slate-200 bg-white p-4">
                        {/* Grid: text column + button column */}
                        <div className="flex flex-col gap-3 sm:grid sm:grid-cols-[1fr_auto]">
                          {/* Left column: all text info */}
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900">{doc.original_name}</p>
                              {doc.ai_fed ? (
                                <Badge className="bg-emerald-600">Fed to AI</Badge>
                              ) : doc.ai_feed_error ? (
                                <Badge variant="destructive">Feed failed</Badge>
                              ) : (
                                <Badge variant="secondary">Not fed</Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">
                              {doc.mime_type} - {formatFileSize(doc.file_size)}
                            </p>
                            {/* AI feed error with expand/collapse */}
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
                          {/* Right column: action buttons - always at top */}
                          <div className="flex flex-wrap items-start gap-2 justify-self-end">
                            <Button asChild variant="outline" size="sm">
                              <a href={doc.file_path} target="_blank" rel="noreferrer" className="gap-2"><Eye className="h-4 w-4" />View</a>
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2" onClick={() => openFeedModal(doc)} disabled={doc.ai_fed && !doc.ai_feed_error}>
                              <Sparkles className="h-4 w-4" />Feed to AI
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => openDeleteDocumentModal(doc)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      </div>
                    )) : <p className="text-sm text-slate-500">No brand documents uploaded yet.</p>}
                  </div>
                )}
              </Deferred>
            </CardContent>
          </Card>
        </div>

        {/* Brand error codes section */}
        <div className="grid gap-6">
          <Card className="border-0 bg-white/90 shadow-sm">
            <CardHeader><CardTitle className="text-base">Brand error codes</CardTitle><CardDescription>Common errors that apply to all models.</CardDescription></CardHeader>
            <CardContent>
              <Deferred data="errorCodes" fallback={<div className="space-y-3"><div className="h-16 animate-pulse rounded-md bg-slate-200" /><div className="h-16 animate-pulse rounded-md bg-slate-200" /></div>}>
                {() => (
                  <div className="space-y-3">
                    {errorCodes?.data.length ? errorCodes.data.map((ec) => (
                      <div key={ec.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2"><Badge variant="outline">{ec.code}</Badge><p className="text-sm font-semibold text-slate-900">{ec.description}</p></div>
                          <Button variant="ghost" size="sm" onClick={() => openDeleteErrorCodeModal(ec)}><Trash2 className="h-4 w-4 text-slate-500" /></Button>
                        </div>
                        <p className="mt-3 text-sm text-slate-600">{ec.resolution_steps}</p>
                      </div>
                    )) : <p className="text-sm text-slate-500">No brand error codes yet.</p>}
                  </div>
                )}
              </Deferred>
              {errorCodes?.links && errorCodes.links.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t bg-slate-50 px-4 py-3 text-sm">
                  {errorCodes.links.map((link, idx) => link.url ? <Link key={idx} href={link.url} className={`rounded-full border px-3 py-1 transition ${link.active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600'}`} dangerouslySetInnerHTML={{ __html: link.label }} /> : <span key={idx} className="rounded-full border border-slate-200 px-3 py-1 text-slate-400" dangerouslySetInnerHTML={{ __html: link.label }} />)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Models table */}
        <Card className="border-0 bg-white/90 shadow-sm">
          <CardHeader><CardTitle className="text-base">Models</CardTitle><CardDescription>Model-level manuals and error codes inside each profile.</CardDescription></CardHeader>
          <CardContent>
            <Deferred data="models" fallback={<div className="space-y-2"><div className="h-12 animate-pulse rounded-md bg-slate-200" /><div className="h-12 animate-pulse rounded-md bg-slate-200" /></div>}>
              {() => (
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="min-w-full text-sm">
                    <thead className="border-b bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                      <tr><th className="px-4 py-3 text-left">Model</th><th className="px-4 py-3 text-left">Model #</th><th className="px-4 py-3 text-left">Docs</th><th className="px-4 py-3 text-left">Errors</th><th className="px-4 py-3 text-left">Action</th></tr>
                    </thead>
                    <tbody>
                      {models?.data.map((model) => (
                        <tr key={model.id} className="border-b last:border-b-0">
                          <td className="px-4 py-3"><p className="text-sm font-semibold text-slate-900">{model.name}</p><p className="text-xs text-slate-500">{model.capacity_btu ? `${model.capacity_btu} BTU` : 'Capacity not set'}</p></td>
                          <td className="px-4 py-3 text-slate-600">{model.model_number ?? '-'}</td>
                          <td className="px-4 py-3 text-slate-600">{model.documents_count ?? 0}</td>
                          <td className="px-4 py-3 text-slate-600">{model.error_codes_count ?? 0}</td>
                          <td className="px-4 py-3"><Button asChild variant="outline" size="sm"><Link href={`/hvac-models/${model.id}`} prefetch className="gap-2"><Eye className="h-4 w-4" />View</Link></Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {models?.data.length === 0 && <p className="p-4 text-sm text-slate-500">No models found for this brand.</p>}
                  {models?.links && models.links.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 border-t bg-slate-50 px-4 py-3 text-sm">
                      {models.links.map((link, idx) => link.url ? <Link key={idx} href={link.url} className={`rounded-full border px-3 py-1 transition ${link.active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600'}`} dangerouslySetInnerHTML={{ __html: link.label }} /> : <span key={idx} className="rounded-full border border-slate-200 px-3 py-1 text-slate-400" dangerouslySetInnerHTML={{ __html: link.label }} />)}
                    </div>
                  )}
                </div>
              )}
            </Deferred>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
