import AdminLayout from '@/layouts/AdminLayout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { ArrowLeft, Eye, Plus, Sparkles, Trash2, Upload } from 'lucide-react';
import { FormEvent, useRef, useState } from 'react';

type BrandInfo = {
  id: number;
  name: string;
  logo_path: string | null;
};

type HvacModelDetail = {
  id: number;
  name: string;
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
    index += 1;
  }

  const precision = value >= 10 || index === 0 ? 0 : 1;

  return `${value.toFixed(precision)} ${units[index]}`;
};

export default function HvacModelShow() {
  const { model, documents, errorCodes, flash } =
    usePage<HvacModelShowProps>().props;
  const [isDocumentOpen, setIsDocumentOpen] = useState(false);
  const [isErrorCodeOpen, setIsErrorCodeOpen] = useState(false);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const documentForm = useForm<{ document: File | null }>({
    document: null,
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

  const submitDocument = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    documentForm.post(`/hvac-models/${model.id}/documents`, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        documentForm.reset();
        if (documentInputRef.current) {
          documentInputRef.current.value = '';
        }
        setIsDocumentOpen(false);
      },
    });
  };

  const submitErrorCode = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    errorCodeForm.post(`/hvac-models/${model.id}/error-codes`, {
      preserveScroll: true,
      onSuccess: () => {
        errorCodeForm.reset();
        setIsErrorCodeOpen(false);
      },
    });
  };

  const deleteDocument = (documentId: number): void => {
    if (!confirm('Delete this document?')) {
      return;
    }

    router.delete(`/hvac-models/${model.id}/documents/${documentId}`, {
      preserveScroll: true,
    });
  };

  const deleteErrorCode = (errorCodeId: number): void => {
    if (!confirm('Delete this error code?')) {
      return;
    }

    router.delete(`/hvac-models/${model.id}/error-codes/${errorCodeId}`, {
      preserveScroll: true,
    });
  };

  return (
    <AdminLayout title={`Model - ${model.name}`}>
      <Head title={`${model.name} Model`} />

      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm">
          <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-sky-100/80 blur-3xl" />
          <div className="absolute -left-24 -bottom-24 h-48 w-48 rounded-full bg-indigo-100/70 blur-3xl" />
          <div className="relative space-y-4">
            <Link
              href={model.brand ? `/brands/${model.brand.id}` : '/brands'}
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to brand
            </Link>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                {model.image_path ? (
                  <img
                    src={model.image_path}
                    alt={model.name}
                    className="h-16 w-16 rounded-2xl object-cover ring-1 ring-slate-200"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-lg font-semibold text-slate-500">
                    {model.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    HVAC model
                  </p>
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                    {model.name}
                  </h1>
                  <p className="text-sm text-slate-600">
                    {model.brand?.name ?? 'Brand'} - Model-specific documents and errors.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Dialog
                  open={isDocumentOpen}
                  onOpenChange={setIsDocumentOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Upload className="h-4 w-4" />
                      Upload document
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Upload model document</DialogTitle>
                      <DialogDescription>
                        Add model-specific manuals, wiring diagrams, or service notes.
                      </DialogDescription>
                    </DialogHeader>
                    <Alert className="border-amber-200 bg-amber-50 text-amber-900">
                      <Sparkles />
                      <AlertTitle>AI usage notice</AlertTitle>
                      <AlertDescription>
                        Uploading a document will be processed by AI to improve troubleshooting. This uses AI tokens.
                      </AlertDescription>
                    </Alert>
                    <form onSubmit={submitDocument} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                          Document file
                        </label>
                        <Input
                          type="file"
                          accept=".pdf,.docx,.xlsx,.csv,.txt,image/*"
                          ref={documentInputRef}
                          onChange={(event) =>
                            documentForm.setData(
                              'document',
                              event.target.files?.[0] ?? null,
                            )
                          }
                          className={
                            documentForm.errors.document
                              ? 'border-red-500'
                              : ''
                          }
                        />
                        {documentForm.errors.document && (
                          <span className="text-xs text-red-500">
                            {documentForm.errors.document}
                          </span>
                        )}
                      </div>
                      <DialogFooter>
                        <Button
                          type="submit"
                          disabled={documentForm.processing}
                        >
                          {documentForm.processing
                            ? 'Uploading...'
                            : 'Upload document'}
                        </Button>
                      </DialogFooter>
                    </form>
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
                      <DialogTitle>Add model error code</DialogTitle>
                      <DialogDescription>
                        Document model-specific errors and the exact fix steps.
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
              </div>
            </div>
          </div>
        </section>

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

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="space-y-1">
              <CardDescription>Documents</CardDescription>
              <CardTitle className="text-3xl text-slate-900">
                {model.documents_count}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="space-y-1">
              <CardDescription>Error codes</CardDescription>
              <CardTitle className="text-3xl text-slate-900">
                {model.error_codes_count}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="space-y-1">
              <CardDescription>Brand</CardDescription>
              <CardTitle className="text-xl text-slate-900">
                {model.brand?.name ?? 'Brand'}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <Card className="border-0 bg-white/90 shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">Model details</CardTitle>
              <CardDescription>
                Core specs that technicians reference during diagnostics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Model number
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {model.model_number ?? '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Capacity
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {model.capacity_btu
                      ? `${model.capacity_btu} BTU`
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Efficiency
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {model.efficiency_rating ?? '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Power spec
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {model.power_spec ?? '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Refrigerant
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {model.refrigerant_type ?? '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/90 shadow-sm">
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
                    className="h-10 w-10 rounded-lg object-cover ring-1 ring-slate-200"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-500">
                    {model.brand?.name
                      ? model.brand.name
                        .slice(0, 2)
                        .toUpperCase()
                      : 'BR'}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {model.brand?.name ?? 'Brand'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Shared resources and error codes
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link
                  href={
                    model.brand
                      ? `/brands/${model.brand.id}`
                      : '/brands'
                  }
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View brand
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <Card className="border-0 bg-white/90 shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">Model documents</CardTitle>
              <CardDescription>
                Documentation that is specific to this model.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Deferred
                data="documents"
                fallback={
                  <div className="space-y-3">
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
                            <p className="text-sm font-semibold text-slate-900">
                              {document.original_name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {document.mime_type} - {formatFileSize(document.file_size)}
                            </p>
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
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                deleteDocument(document.id)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">
                        No model documents uploaded yet.
                      </p>
                    )}
                  </div>
                )}
              </Deferred>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/90 shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">Model error codes</CardTitle>
              <CardDescription>
                Errors that apply only to this model.
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
                    {errorCodes?.length ? (
                      errorCodes.map((errorCode) => (
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
                                deleteErrorCode(errorCode.id)
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
                        No model error codes yet.
                      </p>
                    )}
                  </div>
                )}
              </Deferred>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
