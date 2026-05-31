import AdminLayout from '@/layouts/AdminLayout';
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
import { Deferred, Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Eye, Plus, Sparkles, Trash2, Upload, X } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

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
    index += 1;
  }

  const precision = value >= 10 || index === 0 ? 0 : 1;

  return `${value.toFixed(precision)} ${units[index]}`;
};

export default function BrandShow() {
  const { brand, documents, errorCodes, models, flash } =
    usePage<BrandShowProps>().props;
  const [showSuccess, setShowSuccess] = useState(Boolean(flash?.success));
  const [showError, setShowError] = useState(Boolean(flash?.error));
  const [isDocumentOpen, setIsDocumentOpen] = useState(false);
  const [isErrorCodeOpen, setIsErrorCodeOpen] = useState(false);
  const [isFeedOpen, setIsFeedOpen] = useState(false);
  const [feedTarget, setFeedTarget] = useState<SupportDocument | null>(null);
  const [isDeleteBrandOpen, setIsDeleteBrandOpen] = useState(false);
  const [isDeleteDocumentOpen, setIsDeleteDocumentOpen] = useState(false);
  const [deleteDocumentTarget, setDeleteDocumentTarget] =
    useState<SupportDocument | null>(null);
  const [isDeleteErrorCodeOpen, setIsDeleteErrorCodeOpen] = useState(false);
  const [deleteErrorCodeTarget, setDeleteErrorCodeTarget] =
    useState<ErrorCode | null>(null);
  const [showFullDocumentError, setShowFullDocumentError] = useState(false);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const documentForm = useForm<{ documents: File[] }>({
    documents: [],
  });

  const errorCodeForm = useForm<{
    code: string;
    description: string;
    resolution_steps: string;
  }>({
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

  const submitDocument = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    documentForm.post(`/brands/${brand.id}/documents`, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        documentForm.reset();
        if (documentInputRef.current) {
          documentInputRef.current.value = '';
        }
        setIsDocumentOpen(false);
        setShowFullDocumentError(false);
      },
    });
  };

  const submitErrorCode = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    errorCodeForm.post(`/brands/${brand.id}/error-codes`, {
      preserveScroll: true,
      onSuccess: () => {
        errorCodeForm.reset();
        setIsErrorCodeOpen(false);
      },
    });
  };

  const openDeleteBrandModal = (): void => {
    setIsDeleteBrandOpen(true);
  };

  const confirmDeleteBrand = (): void => {
    router.delete(`/brands/${brand.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setIsDeleteBrandOpen(false);
      },
    });
  };

  const openDeleteDocumentModal = (document: SupportDocument): void => {
    setDeleteDocumentTarget(document);
    setIsDeleteDocumentOpen(true);
  };

  const confirmDeleteDocument = (): void => {
    if (!deleteDocumentTarget) {
      return;
    }

    router.delete(
      `/brands/${brand.id}/documents/${deleteDocumentTarget.id}`,
      {
        preserveScroll: true,
        onSuccess: () => {
          setIsDeleteDocumentOpen(false);
          setDeleteDocumentTarget(null);
        },
      },
    );
  };

  const openFeedModal = (document: SupportDocument): void => {
    setFeedTarget(document);
    setIsFeedOpen(true);
  };

  const confirmFeed = (): void => {
    if (!feedTarget) {
      return;
    }

    router.post(
      `/brands/${brand.id}/documents/${feedTarget.id}/feed`,
      {},
      {
        preserveScroll: true,
        onSuccess: () => {
          setIsFeedOpen(false);
          setFeedTarget(null);
        },
      },
    );
  };

  const openDeleteErrorCodeModal = (errorCode: ErrorCode): void => {
    setDeleteErrorCodeTarget(errorCode);
    setIsDeleteErrorCodeOpen(true);
  };

  const confirmDeleteErrorCode = (): void => {
    if (!deleteErrorCodeTarget) {
      return;
    }

    router.delete(
      `/brands/${brand.id}/error-codes/${deleteErrorCodeTarget.id}`,
      {
        preserveScroll: true,
        onSuccess: () => {
          setIsDeleteErrorCodeOpen(false);
          setDeleteErrorCodeTarget(null);
        },
      },
    );
  };

  const documentErrors = Object.entries(documentForm.errors).filter(([key]) =>
    key.startsWith('documents')
  );
  const hasDocumentErrors = documentErrors.length > 0;
  const fullErrorText = documentErrors.map(([, msg]) => msg).join('\n');

  const clearAllFiles = () => {
    documentForm.setData('documents', []);
    if (documentInputRef.current) {
      documentInputRef.current.value = '';
    }
  };

  return (
    <AdminLayout title={`Brand - ${brand.name}`}>
      <Head title={`${brand.name} Brand`} />

      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm">
          <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-indigo-100/80 blur-3xl" />
          <div className="absolute -left-24 -bottom-24 h-48 w-48 rounded-full bg-emerald-100/80 blur-3xl" />
          <div className="relative space-y-4">
            <Link
              href="/brands"
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to brands
            </Link>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                {brand.logo_path ? (
                  <img
                    src={brand.logo_path}
                    alt={brand.name}
                    className="h-16 w-16 rounded-2xl object-cover ring-1 ring-slate-200"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-lg font-semibold text-slate-500">
                    {brand.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Brand profile
                  </p>
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                    {brand.name}
                  </h1>
                  <p className="text-sm text-slate-600">
                    Shared documents and error code library for the brand.
                  </p>
                  <p className="text-xs text-slate-500">
                    Created {new Date(brand.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Dialog
                  open={isDocumentOpen}
                  onOpenChange={(open) => {
                    setIsDocumentOpen(open);
                    if (!open) {
                      setShowFullDocumentError(false);
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Upload className="h-4 w-4" />
                      Upload document
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Upload brand document</DialogTitle>
                      <DialogDescription>
                        Add manuals, datasheets, or service notes for this brand.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitDocument} className="space-y-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">
                            Select documents
                          </label>
                          <Input
                            type="file"
                            accept=".pdf,.docx,.xlsx,.csv,.txt,image/*"
                            multiple
                            ref={documentInputRef}
                            onChange={(event) => {
                              const newFiles = Array.from(event.target.files || []);
                              documentForm.setData('documents', [
                                ...documentForm.data.documents,
                                ...newFiles,
                              ]);
                              if (documentInputRef.current) {
                                documentInputRef.current.value = '';
                              }
                            }}
                            className={
                              hasDocumentErrors
                                ? 'border-red-500'
                                : ''
                            }
                          />
                        </div>

                        {documentForm.data.documents.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-medium uppercase tracking-wider text-slate-500">
                                Selected Files ({documentForm.data.documents.length})
                              </label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={clearAllFiles}
                                className="h-7 gap-1 text-xs text-red-600 hover:text-red-800"
                              >
                                <X className="h-3 w-3" />
                                Clear all
                              </Button>
                            </div>
                            <ul className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-2">
                              {documentForm.data.documents.map((file, index) => (
                                <li
                                  key={`${file.name}-${index}`}
                                  className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white p-2 text-sm shadow-sm"
                                >
                                  <div className="flex min-w-0 flex-1 flex-col">
                                    <span className="truncate font-medium text-slate-700">
                                      {file.name}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                      {formatFileSize(file.size)}
                                    </span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 shrink-0 text-slate-400 hover:text-red-600"
                                    onClick={() => {
                                      const newDocs = [...documentForm.data.documents];
                                      newDocs.splice(index, 1);
                                      documentForm.setData('documents', newDocs);
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {hasDocumentErrors && (
                          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="font-medium">
                                  Upload failed with {documentErrors.length} error(s).
                                </p>
                                {showFullDocumentError && (
                                  <pre className="mt-2 whitespace-pre-wrap text-xs text-red-700">
                                    {fullErrorText}
                                  </pre>
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowFullDocumentError(!showFullDocumentError)}
                                className="text-red-700 hover:text-red-900"
                              >
                                {showFullDocumentError ? 'Hide full error' : 'Show full error'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsDocumentOpen(false);
                            setShowFullDocumentError(false);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={documentForm.processing || documentForm.data.documents.length === 0}
                        >
                          {documentForm.processing
                            ? 'Uploading...'
                            : documentForm.data.documents.length === 0
                            ? 'Select files'
                            : `Upload ${documentForm.data.documents.length} ${documentForm.data.documents.length === 1 ? 'document' : 'documents'}`}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                <Dialog
                  open={isFeedOpen}
                  onOpenChange={(open) => {
                    setIsFeedOpen(open);
                    if (!open) {
                      setFeedTarget(null);
                    }
                  }}
                >
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Feed document to AI</DialogTitle>
                      <DialogDescription>
                        This will process the document and use AI tokens.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      <div className="flex items-center gap-2 font-semibold">
                        <Sparkles className="h-4 w-4" />
                        Warning
                      </div>
                      <p className="mt-1 text-sm">
                        Feeding a document to AI will consume tokens and may take a few moments.
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      {feedTarget?.original_name ?? 'Selected document'}
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsFeedOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="button" onClick={confirmFeed}>
                        Feed to AI
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog
                  open={isDeleteBrandOpen}
                  onOpenChange={setIsDeleteBrandOpen}
                >
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Delete brand</DialogTitle>
                      <DialogDescription>
                        This will permanently remove the brand and its related data.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                      You are about to delete {brand.name} and all associated models, documents, and error codes.
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDeleteBrandOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={confirmDeleteBrand}
                      >
                        Delete brand
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog
                  open={isDeleteDocumentOpen}
                  onOpenChange={(open) => {
                    setIsDeleteDocumentOpen(open);
                    if (!open) {
                      setDeleteDocumentTarget(null);
                    }
                  }}
                >
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Delete document</DialogTitle>
                      <DialogDescription>
                        This will permanently remove the document from this brand.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      {deleteDocumentTarget?.original_name ?? 'Selected document'}
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDeleteDocumentOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={confirmDeleteDocument}
                      >
                        Delete document
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog
                  open={isDeleteErrorCodeOpen}
                  onOpenChange={(open) => {
                    setIsDeleteErrorCodeOpen(open);
                    if (!open) {
                      setDeleteErrorCodeTarget(null);
                    }
                  }}
                >
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Delete error code</DialogTitle>
                      <DialogDescription>
                        This will permanently remove the error code entry.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      {deleteErrorCodeTarget?.code ?? 'Selected error code'}
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDeleteErrorCodeOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={confirmDeleteErrorCode}
                      >
                        Delete error code
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog
                  open={isErrorCodeOpen}
                  onOpenChange={setIsErrorCodeOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add error code
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Add brand error code</DialogTitle>
                      <DialogDescription>
                        Capture the official meaning and fix steps for common errors.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitErrorCode} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                          Error code
                        </label>
                        <Input
                          value={errorCodeForm.data.code}
                          onChange={(event) =>
                            errorCodeForm.setData(
                              'code',
                              event.target.value,
                            )
                          }
                          placeholder="E03"
                          className={
                            errorCodeForm.errors.code
                              ? 'border-red-500'
                              : ''
                          }
                        />
                        {errorCodeForm.errors.code && (
                          <span className="text-xs text-red-500">
                            {errorCodeForm.errors.code}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                          Description
                        </label>
                        <textarea
                          value={errorCodeForm.data.description}
                          onChange={(event) =>
                            errorCodeForm.setData(
                              'description',
                              event.target.value,
                            )
                          }
                          className={`min-h-[90px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none ${errorCodeForm.errors.description
                            ? 'border-red-500'
                            : 'border-slate-200'
                            }`}
                          placeholder="What the code indicates"
                        />
                        {errorCodeForm.errors.description && (
                          <span className="text-xs text-red-500">
                            {errorCodeForm.errors.description}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                          Resolution steps
                        </label>
                        <textarea
                          value={errorCodeForm.data.resolution_steps}
                          onChange={(event) =>
                            errorCodeForm.setData(
                              'resolution_steps',
                              event.target.value,
                            )
                          }
                          className={`min-h-[110px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none ${errorCodeForm.errors.resolution_steps
                            ? 'border-red-500'
                            : 'border-slate-200'
                            }`}
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
                          type="submit"
                          disabled={errorCodeForm.processing}
                        >
                          {errorCodeForm.processing
                            ? 'Saving...'
                            : 'Save error code'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                <Button
                  type="button"
                  variant="destructive"
                  className="gap-2"
                  onClick={openDeleteBrandModal}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete brand
                </Button>
              </div>
            </div>
          </div>
        </section>

        {flash?.success && showSuccess ? (
          <div className="flex items-start justify-between gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <span>{flash.success}</span>
            <button
              type="button"
              onClick={() => setShowSuccess(false)}
              className="rounded p-1 text-emerald-700/80 transition hover:text-emerald-900"
              aria-label="Dismiss success message"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        {flash?.error && showError ? (
          <div className="flex items-start justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <span className="break-all">{flash.error}</span>
            <button
              type="button"
              onClick={() => setShowError(false)}
              className="rounded p-1 text-red-700/80 transition hover:text-red-900"
              aria-label="Dismiss error message"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="space-y-1">
              <CardDescription>Total models</CardDescription>
              <CardTitle className="text-3xl text-slate-900">
                {brand.hvac_models_count}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="space-y-1">
              <CardDescription>Brand documents</CardDescription>
              <CardTitle className="text-3xl text-slate-900">
                {brand.documents_count}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="space-y-1">
              <CardDescription>Brand error codes</CardDescription>
              <CardTitle className="text-3xl text-slate-900">
                {brand.error_codes_count}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card className="border-0 bg-white/90 shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">Brand documents</CardTitle>
              <CardDescription>
                Manuals and guidance shared across every model in this brand.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Deferred
                data="documents"
                fallback={
                  <div className="space-y-3">
                    <div className="h-12 animate-pulse rounded-md bg-slate-200" />
                    <div className="h-12 animate-pulse rounded-md bg-slate-200" />
                    <div className="h-12 animate-pulse rounded-md bg-slate-200" />
                  </div>
                }
              >
                {() => (
                  <div className="space-y-3">
                    {documents?.length ? (
                      documents.map((document) => (
                        <div
                          key={document.id}
                          className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900">
                                {document.original_name}
                              </p>
                              {document.ai_fed ? (
                                <Badge className="bg-emerald-600 text-white">
                                  Fed to AI
                                </Badge>
                              ) : document.ai_feed_error ? (
                                <Badge variant="destructive">Feed failed</Badge>
                              ) : (
                                <Badge variant="secondary">Not fed</Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">
                              {document.mime_type} - {formatFileSize(document.file_size)}
                            </p>
                            {document.ai_feed_error?.message ? (
                              <p className="break-all text-xs text-rose-600">
                                {document.ai_feed_error.message}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button asChild variant="outline" size="sm">
                              <a
                                href={document.file_path}
                                target="_blank"
                                rel="noreferrer"
                                className="gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </a>
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => openFeedModal(document)}
                              disabled={document.ai_fed && !document.ai_feed_error}
                            >
                              <Sparkles className="h-4 w-4" />
                              Feed to AI
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                openDeleteDocumentModal(document)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">
                        No brand documents uploaded yet.
                      </p>
                    )}
                  </div>
                )}
              </Deferred>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card className="border-0 bg-white/90 shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">Brand error codes</CardTitle>
              <CardDescription>
                Common errors that apply to all models in the brand.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Deferred
                data="errorCodes"
                fallback={
                  <div className="space-y-3">
                    <div className="h-16 animate-pulse rounded-md bg-slate-200" />
                    <div className="h-16 animate-pulse rounded-md bg-slate-200" />
                  </div>
                }
              >
                {() => (
                  <div className="space-y-3">
                    {errorCodes?.data.length ? (
                      errorCodes.data.map((errorCode) => (
                        <div
                          key={errorCode.id}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-2">
                              <Badge variant="outline">
                                {errorCode.code}
                              </Badge>
                              <p className="text-sm font-semibold text-slate-900">
                                {errorCode.description}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                openDeleteErrorCodeModal(errorCode)
                              }
                            >
                              <Trash2 className="h-4 w-4 text-slate-500" />
                            </Button>
                          </div>
                          <p className="mt-3 text-sm text-slate-600">
                            {errorCode.resolution_steps}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">
                        No brand error codes yet.
                      </p>
                    )}
                  </div>
                )}
              </Deferred>
              {errorCodes?.links && errorCodes.links.length > 0 ? (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t bg-slate-50 px-4 py-3 text-sm">
                  {errorCodes.links.map((link, index) =>
                    link.url ? (
                      <Link
                        key={`${link.label}-${index}`}
                        href={link.url}
                        className={`rounded-full border px-3 py-1 transition ${link.active
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                          }`}
                        dangerouslySetInnerHTML={{
                          __html: link.label,
                        }}
                      />
                    ) : (
                      <span
                        key={`${link.label}-${index}`}
                        className="rounded-full border border-slate-200 px-3 py-1 text-slate-400"
                        dangerouslySetInnerHTML={{
                          __html: link.label,
                        }}
                      />
                    ),
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 bg-white/90 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Models</CardTitle>
            <CardDescription>
              Model-level manuals and error codes live inside each model profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Deferred
              data="models"
              fallback={
                <div className="space-y-2">
                  <div className="h-12 animate-pulse rounded-md bg-slate-200" />
                  <div className="h-12 animate-pulse rounded-md bg-slate-200" />
                  <div className="h-12 animate-pulse rounded-md bg-slate-200" />
                </div>
              }
            >
              {() => (
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="min-w-full text-sm">
                    <thead className="border-b bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                      <tr>
                        <th className="px-4 py-3 text-left">Model</th>
                        <th className="px-4 py-3 text-left">Model #</th>
                        <th className="px-4 py-3 text-left">Docs</th>
                        <th className="px-4 py-3 text-left">Errors</th>
                        <th className="px-4 py-3 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {models?.data.map((model) => (
                        <tr
                          key={model.id}
                          className="border-b last:border-b-0"
                        >
                          <td className="px-4 py-3">
                            <p className="text-sm font-semibold text-slate-900">
                              {model.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {model.capacity_btu
                                ? `${model.capacity_btu} BTU`
                                : 'Capacity not set'}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {model.model_number ?? '-'}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {model.documents_count ?? 0}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {model.error_codes_count ?? 0}
                          </td>
                          <td className="px-4 py-3">
                            <Button asChild variant="outline" size="sm">
                              <Link
                                href={`/hvac-models/${model.id}`}
                                prefetch
                                className="gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {models?.data.length === 0 ? (
                    <p className="p-4 text-sm text-slate-500">
                      No models found for this brand.
                    </p>
                  ) : null}

                  {models?.links && models.links.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2 border-t bg-slate-50 px-4 py-3 text-sm">
                      {models.links.map((link, index) =>
                        link.url ? (
                          <Link
                            key={`${link.label}-${index}`}
                            href={link.url}
                            className={`rounded-full border px-3 py-1 transition ${link.active
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                              }`}
                            dangerouslySetInnerHTML={{
                              __html: link.label,
                            }}
                          />
                        ) : (
                          <span
                            key={`${link.label}-${index}`}
                            className="rounded-full border border-slate-200 px-3 py-1 text-slate-400"
                            dangerouslySetInnerHTML={{
                              __html: link.label,
                            }}
                          />
                        ),
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </Deferred>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
