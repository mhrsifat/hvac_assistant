import { Deferred, Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Eye, Plus, Search, Trash2, X } from 'lucide-react';
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

type BrandOption = {
    id: number;
    name: string;
};

type HvacModel = {
    id: number;
    brand_id: number;
    name: string;
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
    const [showSuccess, setShowSuccess] = useState(Boolean(flash?.success));
    const [showError, setShowError] = useState(Boolean(flash?.error));
    const [search, setSearch] = useState(filters.search ?? '');
    const [brandFilter, setBrandFilter] = useState(filters.brand_id ? String(filters.brand_id) : '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<HvacModel | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);

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

    useEffect(() => {
        setShowSuccess(Boolean(flash?.success));
    }, [flash?.success]);

    useEffect(() => {
        setShowError(Boolean(flash?.error));
    }, [flash?.error]);

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
            },
        });
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

        router.delete(`/hvac-models/${deleteTarget.id}`, {
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
                <section className="relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm">
                    <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-sky-200/60 blur-3xl" />
                    <div className="absolute -left-24 -bottom-24 h-48 w-48 rounded-full bg-indigo-200/70 blur-3xl" />
                    <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                Catalog
                            </p>
                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                                HVAC Models
                            </h1>
                            <p className="max-w-xl text-sm text-slate-600">
                                Manage model profiles, specs, documents, and error codes for every unit in the field.
                            </p>
                        </div>
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
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
                                        <label className="text-sm font-medium text-slate-700">Brand</label>
                                        <select
                                            className={`h-10 w-full rounded-md border px-3 text-sm ${createForm.errors.brand_id ? 'border-red-500' : 'border-slate-200'}`}
                                            value={createForm.data.brand_id}
                                            onChange={(e) => createForm.setData('brand_id', e.target.value)}
                                        >
                                            <option value="">Select brand</option>
                                            {brands.map((brand) => (
                                                <option key={brand.id} value={brand.id}>
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
                                            <label className="text-sm font-medium text-slate-700">Model name</label>
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
                                            <label className="text-sm font-medium text-slate-700">Model number</label>
                                            <Input
                                                value={createForm.data.model_number}
                                                onChange={(e) => createForm.setData('model_number', e.target.value)}
                                                placeholder="e.g. MSZ-GL12NA"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">Capacity (BTU)</label>
                                            <Input
                                                type="number"
                                                value={createForm.data.capacity_btu}
                                                onChange={(e) => createForm.setData('capacity_btu', e.target.value)}
                                                placeholder="e.g. 12000"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">Efficiency rating</label>
                                            <Input
                                                value={createForm.data.efficiency_rating}
                                                onChange={(e) => createForm.setData('efficiency_rating', e.target.value)}
                                                placeholder="e.g. SEER 22"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">Power spec</label>
                                            <Input
                                                value={createForm.data.power_spec}
                                                onChange={(e) => createForm.setData('power_spec', e.target.value)}
                                                placeholder="e.g. 220V / 60Hz"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">Refrigerant type</label>
                                            <Input
                                                value={createForm.data.refrigerant_type}
                                                onChange={(e) => createForm.setData('refrigerant_type', e.target.value)}
                                                placeholder="e.g. R-410A"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Model image</label>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            ref={imageInputRef}
                                            onChange={(e) => createForm.setData('image', e.target.files?.[0] ?? null)}
                                            className={createForm.errors.image ? 'border-red-500' : ''}
                                        />
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
                    <div className="flex items-start justify-between gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                        <span>{flash.success}</span>
                        <button
                            type="button"
                            onClick={() => setShowSuccess(false)}
                            className="rounded p-1 text-emerald-700/80 transition hover:text-emerald-900"
                            aria-label="Dismiss"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : null}

                {flash?.error && showError ? (
                    <div className="flex items-start justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        <span>{flash.error}</span>
                        <button
                            type="button"
                            onClick={() => setShowError(false)}
                            className="rounded p-1 text-red-700/80 transition hover:text-red-900"
                            aria-label="Dismiss"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : null}

                {/* Filters */}
                <Card className="border-0 bg-white/90 shadow-sm">
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
                                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700"
                                value={brandFilter}
                                onChange={(e) => setBrandFilter(e.target.value)}
                            >
                                <option value="">All brands</option>
                                {brands.map((brand) => (
                                    <option key={brand.id} value={brand.id}>
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
                                    className="gap-1 text-slate-500"
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
                            <div className="h-16 animate-pulse rounded-md bg-gray-200" />
                            <div className="h-16 animate-pulse rounded-md bg-gray-200" />
                            <div className="h-16 animate-pulse rounded-md bg-gray-200" />
                        </div>
                    }
                >
                    {() => (
                        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="border-b bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
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
                                                className="border-b transition-colors last:border-b-0 hover:bg-slate-50/50"
                                            >
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {model.image_path ? (
                                                            <img
                                                                src={model.image_path}
                                                                alt={model.name}
                                                                className="h-10 w-10 rounded-lg object-cover ring-1 ring-slate-200"
                                                            />
                                                        ) : (
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-500">
                                                                {model.name.slice(0, 2).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <p className="font-semibold text-slate-900">{model.name}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    {model.brand ? (
                                                        <Badge variant="outline">{model.brand.name}</Badge>
                                                    ) : (
                                                        <span className="text-slate-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-slate-600">
                                                    {model.model_number ?? '—'}
                                                </td>
                                                <td className="px-4 py-4 text-slate-600">
                                                    {model.capacity_btu
                                                        ? `${model.capacity_btu.toLocaleString()} BTU`
                                                        : '—'}
                                                </td>
                                                <td className="px-4 py-4 text-slate-600">
                                                    {model.refrigerant_type ?? '—'}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        <Button asChild variant="outline" size="sm">
                                                            <Link
                                                                href={`/hvac-models/${model.id}`}
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
                                                            className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
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
                                    <p className="p-6 text-sm text-slate-500">No HVAC models found.</p>
                                ) : null}

                                {models?.links && models.links.length > 0 ? (
                                    <div className="flex flex-wrap items-center gap-2 border-t bg-slate-50 px-4 py-3 text-sm">
                                        {models.links.map((link, index) =>
                                            link.url ? (
                                                <Link
                                                    key={`${link.label}-${index}`}
                                                    href={link.url}
                                                    className={`rounded-full border px-3 py-1 transition ${
                                                        link.active
                                                            ? 'border-slate-900 bg-slate-900 text-white'
                                                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                                                    }`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ) : (
                                                <span
                                                    key={`${link.label}-${index}`}
                                                    className="rounded-full border border-slate-200 px-3 py-1 text-slate-400"
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
