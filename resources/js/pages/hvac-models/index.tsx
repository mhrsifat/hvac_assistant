import { Deferred, Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Eye, Plus, Search, Trash2, X, Upload } from 'lucide-react';
import type { FormEvent } from 'react';
import { useRef, useState } from 'react';
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

type BrandOption = {
    id: number;
    name: string;
};

type HvacModel = {
    id: number;
    name: string;
    slug: string;
    brand_id: number;
    model_number: string | null;
    capacity_btu: number | null;
    efficiency_rating: string | null;
    power_spec: string | null;
    refrigerant_type: string | null;
    image_path: string | null;
    brand?: BrandOption | null;
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

type HvacModelsPageProps = {
    models?: PaginatedResponse<HvacModel>;
    brands: BrandOption[];
    filters: {
        search: string;
        brand_id: number | null;
    };
    flash?: {
        success?: string;
        error?: string;
    };
};

export default function HvacModelsIndex() {
    const { models, brands, filters, flash } = usePage<HvacModelsPageProps>().props;
    const [dismissedSuccess, setDismissedSuccess] = useState<string | null>(null);
    const [dismissedError, setDismissedError] = useState<string | null>(null);
    const showSuccess = Boolean(flash?.success) && flash?.success !== dismissedSuccess;
    const showError = Boolean(flash?.error) && flash?.error !== dismissedError;
    const [search, setSearch] = useState(filters.search ?? '');
    const [brandFilter, setBrandFilter] = useState(filters.brand_id ? String(filters.brand_id) : '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<HvacModel | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    
    // Drag & Drop + Image Preview States
    const [isDragging, setIsDragging] = useState(false);
    const dragCounter = useRef(0);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const createForm = useForm<{
        brand_id: string;
        name: string;
        model_number: string;
        capacity_btu: string;
        efficiency_rating: string;
        power_spec: string;
        refrigerant_type: string;
        image: File | null;
    }>({
        brand_id: '',
        name: '',
        model_number: '',
        capacity_btu: '',
        efficiency_rating: '',
        power_spec: '',
        refrigerant_type: '',
        image: null,
    });

    const submitCreate = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        createForm.post('/hvac-models', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();

                if (imageInputRef.current) {
                    imageInputRef.current.value = '';
                }

                setIsCreateOpen(false);
                setIsDragging(false);
                dragCounter.current = 0;

                if (imagePreview) {
                    URL.revokeObjectURL(imagePreview);
                }

                setImagePreview(null);
            },
        });
    };

    // Improved Drag and Drop Handlers to prevent blinking
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current += 1;

        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current -= 1;

        if (dragCounter.current === 0) {
            setIsDragging(false);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        dragCounter.current = 0;

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            createForm.setData('image', file);

            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }

            setImagePreview(URL.createObjectURL(file));
            e.dataTransfer.clearData();
        }
    };

    const triggerFileInput = () => {
        imageInputRef.current?.click();
    };

    const clearImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        createForm.setData('image', null);

        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }

        setImagePreview(null);

        if (imageInputRef.current) {
            imageInputRef.current.value = '';
        }
    };

    const applyFilters = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        router.get(
            '/hvac-models',
            { search, brand_id: brandFilter || undefined },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const openDeleteModal = (model: HvacModel): void => {
        setDeleteTarget(model);
        setIsDeleteOpen(true);
    };

    const confirmDelete = (): void => {
        if (!deleteTarget) {
            return;
        }

        router.delete(`/hvac-models/${deleteTarget.slug}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteOpen(false);
                setDeleteTarget(null);
            },
        });
    };

    return (
        <AdminLayout title="HVAC Models">
            <Head title="HVAC Models" />

            <div className="space-y-8">
                {/* Header */}
                <section className="relative overflow-hidden rounded-2xl border bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-sky-200/60 blur-3xl" />
                    <div className="absolute -left-24 -bottom-24 h-48 w-48 rounded-full bg-indigo-200/70 blur-3xl" />
                    <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                                Catalog
                            </p>
                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                                HVAC Models
                            </h1>
                            <p className="max-w-xl text-sm text-slate-600 dark:text-slate-300">
                                Manage model profiles, specs, documents, and error codes for every unit in the field.
                            </p>
                        </div>
                        <Dialog open={isCreateOpen} onOpenChange={(open) => {
                            setIsCreateOpen(open);

                            if (!open) {
                                setIsDragging(false);
                                dragCounter.current = 0;
                                createForm.reset();

                                if (imagePreview) {
                                    URL.revokeObjectURL(imagePreview);
                                }

                                setImagePreview(null);
                            }
                        }}>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Create model
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>Create HVAC model</DialogTitle>
                                    <DialogDescription>
                                        Add a new model to the catalog with its specs and brand.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={submitCreate} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Brand</label>
                                        <select
                                            className={`h-10 w-full rounded-md border bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 text-sm ${createForm.errors.brand_id ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'}`}
                                            value={createForm.data.brand_id}
                                            onChange={(e) => createForm.setData('brand_id', e.target.value)}
                                        >
                                            <option value="" className="bg-white dark:bg-slate-900">Select brand</option>
                                            {brands.map((brand) => (
                                                <option key={brand.id} value={brand.id} className="bg-white dark:bg-slate-900">
                                                    {brand.name}
                                                </option>
                                            ))}
                                        </select>
                                        {createForm.errors.brand_id && (
                                            <span className="text-xs text-red-500">{createForm.errors.brand_id}</span>
                                        )}
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Model name</label>
                                            <Input
                                                value={createForm.data.name}
                                                onChange={(e) => createForm.setData('name', e.target.value)}
                                                placeholder="e.g. Split AC 12000"
                                                className={createForm.errors.name ? 'border-red-500' : ''}
                                            />
                                            {createForm.errors.name && (
                                                <span className="text-xs text-red-500">{createForm.errors.name}</span>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Model number</label>
                                            <Input
                                                value={createForm.data.model_number}
                                                onChange={(e) => createForm.setData('model_number', e.target.value)}
                                                placeholder="e.g. MSZ-GL12NA"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Capacity (BTU)</label>
                                            <Input
                                                type="number"
                                                value={createForm.data.capacity_btu}
                                                onChange={(e) => createForm.setData('capacity_btu', e.target.value)}
                                                placeholder="e.g. 12000"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Efficiency rating</label>
                                            <Input
                                                value={createForm.data.efficiency_rating}
                                                onChange={(e) => createForm.setData('efficiency_rating', e.target.value)}
                                                placeholder="e.g. SEER 22"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Power spec</label>
                                            <Input
                                                value={createForm.data.power_spec}
                                                onChange={(e) => createForm.setData('power_spec', e.target.value)}
                                                placeholder="e.g. 220V / 60Hz"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Refrigerant type</label>
                                            <Input
                                                value={createForm.data.refrigerant_type}
                                                onChange={(e) => createForm.setData('refrigerant_type', e.target.value)}
                                                placeholder="e.g. R-410A"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Model image</label>
                                        <div
                                            onDragEnter={handleDragEnter}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            onClick={triggerFileInput}
                                            className={`relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                                                isDragging
                                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/50'
                                                    : 'border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 hover:border-indigo-400'
                                            } ${createForm.errors.image ? 'border-red-500' : ''}`}
                                        >
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                ref={imageInputRef}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0] ?? null;
                                                    createForm.setData('image', file);

                                                    if (imagePreview) {
                                                        URL.revokeObjectURL(imagePreview);
                                                    }

                                                    if (file) {
                                                        setImagePreview(URL.createObjectURL(file));
                                                    } else {
                                                        setImagePreview(null);
                                                    }
                                                }}
                                                className="hidden"
                                            />
                                            
                                            {/* Preview Section */}
                                            {createForm.data.image ? (
                                                <div className="flex flex-col items-center gap-3 p-4 w-full pointer-events-none">
                                                    {imagePreview && (
                                                        <img 
                                                            src={imagePreview} 
                                                            alt="Model preview" 
                                                            className="h-20 w-20 rounded-lg object-contain bg-white ring-1 ring-slate-200 dark:ring-slate-700 shadow-sm"
                                                        />
                                                    )}
                                                    <div className="flex items-center gap-2 rounded-full bg-slate-200/50 dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 pointer-events-auto shadow-sm">
                                                        <span className="max-w-[200px] truncate font-medium">{createForm.data.image.name}</span>
                                                        <button
                                                            type="button"
                                                            onClick={clearImage}
                                                            className="ml-1 rounded-full p-1 bg-white/50 dark:bg-black/20 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Click or drag to change image</p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 p-6 text-slate-500 dark:text-slate-400 pointer-events-none">
                                                    <Upload className={`h-8 w-8 transition-colors ${isDragging ? 'text-indigo-500' : 'text-slate-400'}`} />
                                                    <div className="text-center text-sm">
                                                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">Click to upload</span> or drag and drop
                                                    </div>
                                                    <p className="text-xs text-slate-400">PNG, JPG, WEBP, SVG</p>
                                                </div>
                                            )}
                                        </div>
                                        {createForm.errors.image && (
                                            <span className="text-xs text-red-500">{createForm.errors.image}</span>
                                        )}
                                    </div>
                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={createForm.processing}>
                                            {createForm.processing ? 'Creating...' : 'Create model'}
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
                <Card className="border-0 bg-white dark:bg-slate-900/90 shadow-sm">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-base">Filter models</CardTitle>
                        <CardDescription>Search by name or model number and filter by brand.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={applyFilters} className="flex flex-col gap-3 sm:flex-row">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search models..."
                                    className="pl-10"
                                />
                            </div>
                            <select
                                className="h-10 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-700 dark:text-slate-300"
                                value={brandFilter}
                                onChange={(e) => setBrandFilter(e.target.value)}
                            >
                                <option value="" className="bg-white dark:bg-slate-900">All brands</option>
                                {brands.map((brand) => (
                                    <option key={brand.id} value={brand.id} className="bg-white dark:bg-slate-900">
                                        {brand.name}
                                    </option>
                                ))}
                            </select>
                            <Button type="submit" variant="outline">
                                Search
                            </Button>
                            {filters.search || filters.brand_id ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="gap-1 text-slate-500 dark:text-slate-400"
                                    onClick={() => router.get('/hvac-models', {}, { replace: true })}
                                >
                                    <X className="h-3.5 w-3.5" /> Clear
                                </Button>
                            ) : null}
                        </form>
                    </CardContent>
                </Card>

                {/* Table */}
                <Deferred
                    data="models"
                    fallback={
                        <div className="space-y-2">
                            <div className="h-16 animate-pulse rounded-md bg-gray-200 dark:bg-slate-800" />
                            <div className="h-16 animate-pulse rounded-md bg-gray-200 dark:bg-slate-800" />
                            <div className="h-16 animate-pulse rounded-md bg-gray-200 dark:bg-slate-800" />
                        </div>
                    }
                >
                    {() => (
                        <div className="overflow-hidden rounded-2xl border bg-white dark:bg-slate-900 shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="border-b bg-slate-50 dark:bg-slate-800/50 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                        <tr>
                                            <th className="px-4 py-4 text-left">Model</th>
                                            <th className="px-4 py-4 text-left">Brand</th>
                                            <th className="px-4 py-4 text-left">Model #</th>
                                            <th className="px-4 py-4 text-left">Capacity</th>
                                            <th className="px-4 py-4 text-left">Refrigerant</th>
                                            <th className="px-4 py-4 text-left">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {models?.data.map((model) => (
                                            <tr
                                                key={model.id}
                                                className="border-b transition-colors last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/25 dark:bg-slate-800/50"
                                            >
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {model.image_path ? (
                                                            <img
                                                                src={model.image_path}
                                                                alt={model.name}
                                                                className="h-10 w-10 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-800"
                                                            />
                                                        ) : (
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                                {model.name.slice(0, 2).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <p className="font-semibold text-slate-900 dark:text-white">{model.name}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    {model.brand ? (
                                                        <Badge variant="outline">{model.brand.name}</Badge>
                                                    ) : (
                                                        <span className="text-slate-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                                                    {model.model_number ?? '—'}
                                                </td>
                                                <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                                                    {model.capacity_btu
                                                        ? `${model.capacity_btu.toLocaleString()} BTU`
                                                        : '—'}
                                                </td>
                                                <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                                                    {model.refrigerant_type ?? '—'}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        <Button asChild variant="outline" size="sm">
                                                            <Link
                                                                href={`/hvac-models/${model.slug}`}
                                                                prefetch
                                                                className="gap-2"
                                                            >
                                                                <Eye className="h-3.5 w-3.5" />
                                                                View
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="gap-1.5 border-red-200 dark:border-red-500/20 text-red-600 hover:bg-red-50 dark:bg-red-500/10"
                                                            onClick={() => openDeleteModal(model)}
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

                                {models?.data.length === 0 ? (
                                    <p className="p-6 text-sm text-slate-500 dark:text-slate-400">No HVAC models found.</p>
                                ) : null}

                                {models?.links && models.links.length > 0 ? (
                                    <div className="flex flex-wrap items-center gap-2 border-t bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm">
                                        {models.links.map((link, index) =>
                                            link.url ? (
                                                <Link
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
                        <DialogTitle>Delete HVAC model</DialogTitle>
                        <DialogDescription>
                            Permanently remove this model and all its documents and error codes.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                        You are about to delete <strong>{deleteTarget?.name}</strong>. This action cannot be undone.
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            Delete model
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}