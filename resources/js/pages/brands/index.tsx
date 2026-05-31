import AdminLayout from '@/layouts/AdminLayout';
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
import { Eye, Plus, X } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

type Brand = {
    id: number;
    name: string;
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
    const [showSuccess, setShowSuccess] = useState(Boolean(flash?.success));
    const [showError, setShowError] = useState(Boolean(flash?.error));
    const [search, setSearch] = useState(filters.search ?? '');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    useEffect(() => {
        setShowSuccess(Boolean(flash?.success));
    }, [flash?.success]);

    useEffect(() => {
        setShowError(Boolean(flash?.error));
    }, [flash?.error]);

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
                // Manually clear the physical file input element
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                setIsCreateOpen(false);
            },
        });
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
                <section className="relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm">
                    <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-emerald-200/60 blur-3xl" />
                    <div className="absolute -left-24 -bottom-24 h-48 w-48 rounded-full bg-sky-200/70 blur-3xl" />
                    <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                Catalog
                            </p>
                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                                Brands
                            </h1>
                            <p className="max-w-xl text-sm text-slate-600">
                                Curate brand profiles, shared documents, and error codes your team relies on.
                            </p>
                        </div>
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
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
                                        <label className="text-sm font-medium text-slate-700">
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
                                                    ? 'border-red-500'
                                                    : ''
                                            }
                                        />
                                        {createForm.errors.name && (
                                            <span className="text-xs text-red-500">
                                                {createForm.errors.name}
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            Brand logo
                                        </label>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            ref={fileInputRef}
                                            onChange={(event) =>
                                                createForm.setData(
                                                    'logo',
                                                    event.target.files?.[0] ?? null,
                                                )
                                            }
                                            className={
                                                createForm.errors.logo
                                                    ? 'border-red-500'
                                                    : ''
                                            }
                                        />
                                        {createForm.errors.logo && (
                                            <span className="text-xs text-red-500">
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
                        <span>{flash.error}</span>
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

                <Card className="border-0 bg-white/90 shadow-sm">
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
                        <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
                            <table className="min-w-full text-sm">
                                <thead className="border-b bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
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
                                            className="border-b last:border-b-0"
                                        >
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    {brand.logo_path ? (
                                                        <img
                                                            src={brand.logo_path}
                                                            alt={brand.name}
                                                            className="h-11 w-11 rounded-lg object-cover ring-1 ring-slate-200"
                                                        />
                                                    ) : (
                                                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-500">
                                                            {brand.name.slice(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900">
                                                            {brand.name}
                                                        </p>
                                                        {/* <p className="text-xs text-slate-500">
                                                            Brand profile and shared support assets
                                                        </p> */}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-slate-600">
                                                {brand.hvac_models_count}
                                            </td>
                                            <td className="px-4 py-4 text-slate-600">
                                                {brand.documents_count}
                                            </td>
                                            <td className="px-4 py-4 text-slate-600">
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
                                                            href={`/brands/${brand.id}`}
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
                                <p className="p-6 text-sm text-slate-500">
                                    No brands found.
                                </p>
                            ) : null}

                            {brands?.links && brands.links.length > 0 ? (
                                <div className="flex flex-wrap items-center gap-2 border-t bg-slate-50 px-4 py-3 text-sm">
                                    {brands.links.map((link, index) =>
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
            </div>
        </AdminLayout>
    );
}