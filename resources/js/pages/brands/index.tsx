import { Deferred, Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Eye, Plus, Upload, X } from 'lucide-react';
import type { FormEvent } from 'react';
import { useRef, useState } from 'react';
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
    slug: string;
    logo_path: string | null;
    hvac_models_count: number;
    documents_count: number;
    error_codes_count: number;
};

type PaginatedResponse<T> = {
    data: T[];
    links?: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
};

type BrandsPageProps = {
    brands?: PaginatedResponse<Brand>;
    filters: {
        search: string;
    };
    flash?: {
        success?: string;
        error?: string;
    };
};

export default function BrandsIndex() {
    const { brands, filters, flash } = usePage<BrandsPageProps>().props;
    const [dismissedSuccess, setDismissedSuccess] = useState<string | null>(null);
    const [dismissedError, setDismissedError] = useState<string | null>(null);
    const showSuccess = Boolean(flash?.success) && flash?.success !== dismissedSuccess;
    const showError = Boolean(flash?.error) && flash?.error !== dismissedError;
    const [search, setSearch] = useState(filters.search ?? '');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    
    // Drag and Drop States & Refs
    const [isDragging, setIsDragging] = useState(false);
    const dragCounter = useRef(0);
    
    // Image Preview State
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const createForm = useForm<{
        name: string;
        logo: File | null;
    }>({
        name: '',
        logo: null,
    });

    const submitCreate = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        createForm.post('/brands', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();

                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }

                setIsCreateOpen(false);
                setIsDragging(false);
                dragCounter.current = 0;

                if (logoPreview) {
                    URL.revokeObjectURL(logoPreview);
                }

                setLogoPreview(null);
            },
        });
    };

    // Improved Drag and Drop Handlers
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

    const handleLogoDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        dragCounter.current = 0;
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            createForm.setData('logo', file);

            if (logoPreview) {
                URL.revokeObjectURL(logoPreview);
            }

            setLogoPreview(URL.createObjectURL(file));
            e.dataTransfer.clearData();
        }
    };

    const clearLogo = (e: React.MouseEvent) => {
        e.stopPropagation();
        createForm.setData('logo', null);

        if (logoPreview) {
            URL.revokeObjectURL(logoPreview);
        }

        setLogoPreview(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const applySearch = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        router.get(
            '/brands',
            { search },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    return (
        <AdminLayout title="Brands">
            <Head title="Brands" />

            <div className="space-y-8">
                <section className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-emerald-200/60 dark:bg-emerald-900/40 blur-3xl" />
                    <div className="absolute -left-24 -bottom-24 h-48 w-48 rounded-full bg-sky-200/70 dark:bg-sky-900/40 blur-3xl" />
                    <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                                Catalog
                            </p>
                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                                Brands
                            </h1>
                            <p className="max-w-xl text-sm text-slate-600 dark:text-slate-300">
                                Curate brand profiles, shared documents, and error codes your team relies on.
                            </p>
                        </div>
                        <Dialog open={isCreateOpen} onOpenChange={(open) => {
                            setIsCreateOpen(open);

                            if (!open) {
                                setIsDragging(false);
                                dragCounter.current = 0;
                                createForm.reset();

                                if (logoPreview) {
                                    URL.revokeObjectURL(logoPreview);
                                }

                                setLogoPreview(null);
                            }
                        }}>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Create brand
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>Create a new brand</DialogTitle>
                                    <DialogDescription>
                                        Upload a logo and keep the brand catalog consistent for technicians.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={submitCreate} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Brand name
                                        </label>
                                        <Input
                                            value={createForm.data.name}
                                            onChange={(event) =>
                                                createForm.setData(
                                                    'name',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Samsung, LG, Daikin"
                                            className={
                                                createForm.errors.name
                                                    ? 'border-red-500 dark:border-red-500'
                                                    : ''
                                            }
                                        />
                                        {createForm.errors.name && (
                                            <span className="text-xs text-red-500 dark:text-red-400">
                                                {createForm.errors.name}
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Brand logo
                                        </label>
                                        <div
                                            onDragEnter={handleDragEnter}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleLogoDrop}
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                                                isDragging
                                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/50'
                                                    : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-indigo-400'
                                            } ${createForm.errors.logo ? 'border-red-500' : ''}`}
                                        >
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                ref={fileInputRef}
                                                onChange={(event) => {
                                                    const file = event.target.files?.[0] ?? null;
                                                    createForm.setData('logo', file);

                                                    if (logoPreview) {
                                                        URL.revokeObjectURL(logoPreview);
                                                    }

                                                    if (file) {
                                                        setLogoPreview(URL.createObjectURL(file));
                                                    } else {
                                                        setLogoPreview(null);
                                                    }
                                                }}
                                                className="hidden"
                                            />
                                            
                                            {/* Preview Section */}
                                            {createForm.data.logo ? (
                                                <div className="flex flex-col items-center gap-3 p-4 w-full pointer-events-none">
                                                    {logoPreview && (
                                                        <img 
                                                            src={logoPreview} 
                                                            alt="Logo preview" 
                                                            className="h-20 w-20 rounded-lg object-contain bg-white ring-1 ring-slate-200 dark:ring-slate-700 shadow-sm"
                                                        />
                                                    )}
                                                    <div className="flex items-center gap-2 rounded-full bg-slate-200/50 dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 pointer-events-auto shadow-sm">
                                                        <span className="max-w-[200px] truncate font-medium">{createForm.data.logo.name}</span>
                                                        <button
                                                            type="button"
                                                            onClick={clearLogo}
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
                                        {createForm.errors.logo && (
                                            <span className="text-xs text-red-500 dark:text-red-400">
                                                {createForm.errors.logo}
                                            </span>
                                        )}
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            type="submit"
                                            disabled={createForm.processing}
                                        >
                                            {createForm.processing
                                                ? 'Creating...'
                                                : 'Create brand'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </section>

                {flash?.success && showSuccess ? (
                    <div className="flex items-start justify-between gap-3 rounded-md border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
                        <span>{flash.success}</span>
                        <button
                            type="button"
                            onClick={() => setDismissedSuccess(flash?.success ?? null)}
                            className="rounded p-1 text-emerald-700 dark:text-emerald-400/80 transition hover:text-emerald-900 dark:hover:text-emerald-300"
                            aria-label="Dismiss success message"
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
                            className="rounded p-1 text-red-700 dark:text-red-400/80 transition hover:text-red-900 dark:hover:text-red-300"
                            aria-label="Dismiss error message"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : null}

                <Card className="border-0 bg-white dark:bg-slate-900 shadow-sm">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-base">Brand search</CardTitle>
                        <CardDescription>
                            Quickly filter by brand name to find the right profile.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={applySearch} className="flex flex-col gap-3 sm:flex-row">
                            <Input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search brand..."
                            />
                            <Button type="submit" variant="outline" className="sm:w-auto">
                                Search
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Deferred
                    data="brands"
                    fallback={
                        <div className="space-y-2">
                            <div className="h-12 animate-pulse rounded-md bg-gray-200 dark:bg-zinc-800" />
                            <div className="h-12 animate-pulse rounded-md bg-gray-200 dark:bg-zinc-800" />
                            <div className="h-12 animate-pulse rounded-md bg-gray-200 dark:bg-zinc-800" />
                        </div>
                    }
                >
                    {() => (
                        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                            <table className="min-w-full text-sm">
                                <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                    <tr>
                                        <th className="px-4 py-4 text-left">Brand</th>
                                        <th className="px-4 py-4 text-left">Models</th>
                                        <th className="px-4 py-4 text-left">Documents</th>
                                        <th className="px-4 py-4 text-left">Error codes</th>
                                        <th className="px-4 py-4 text-left">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {brands?.data.map((brand) => (
                                        <tr
                                            key={brand.id}
                                            className="border-b border-slate-200 dark:border-slate-800 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/25 transition-colors"
                                        >
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    {brand.logo_path ? (
                                                        <img
                                                            src={brand.logo_path}
                                                            alt={brand.name}
                                                            className="h-11 w-11 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                                                        />
                                                    ) : (
                                                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                            {brand.name.slice(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                            {brand.name}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                                                {brand.hvac_models_count}
                                            </td>
                                            <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                                                {brand.documents_count}
                                            </td>
                                            <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                                                {brand.error_codes_count}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-wrap gap-2">
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        <Link
                                                            href={`/brands/${brand.slug}`}
                                                            prefetch
                                                            className="gap-2"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                            View
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {brands?.data.length === 0 ? (
                                <p className="p-6 text-sm text-slate-500 dark:text-slate-400">
                                    No brands found.
                                </p>
                            ) : null}

                            {brands?.links && brands.links.length > 0 ? (
                                <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm">
                                    {brands.links.map((link, index) =>
                                        link.url ? (
                                            <Link
                                                key={`${link.label}-${index}`}
                                                href={link.url}
                                                className={`rounded-full border px-3 py-1 transition ${link.active
                                                    ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500'
                                                }`}
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        ) : (
                                            <span
                                                key={`${link.label}-${index}`}
                                                className="rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1 text-slate-400 dark:text-slate-500"
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
            </div>
        </AdminLayout>
    );
}