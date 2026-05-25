import AdminLayout from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Deferred, Head, router, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

type Brand = {
    id: number;
    name: string;
    logo_path: string | null;
    created_at: string;
};

type PaginatedResponse<T> = {
    data: T[];
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
    const [search, setSearch] = useState(filters.search ?? '');
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

    const deleteBrand = (brandId: number): void => {
        router.delete(`/brands/${brandId}`, {
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout title="Brands">
            <Head title="Brands" />

            <div className="space-y-6">
                <h1 className="text-2xl font-semibold">Brands</h1>

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

                <form
                    onSubmit={submitCreate}
                    className="grid gap-3 rounded-lg border bg-white p-4 dark:bg-zinc-900 md:grid-cols-[1fr_1fr_auto]"
                >
                    <Input
                        value={createForm.data.name}
                        onChange={(event) =>
                            createForm.setData('name', event.target.value)
                        }
                        placeholder="Brand name"
                    />
                    <Input
                        type="file"
                        accept="image/*"
                        onChange={(event) =>
                            createForm.setData(
                                'logo',
                                event.target.files?.[0] ?? null,
                            )
                        }
                    />
                    <Button type="submit" disabled={createForm.processing}>
                        {createForm.processing ? 'Creating...' : 'Create Brand'}
                    </Button>
                </form>

                <form onSubmit={applySearch} className="flex gap-3">
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search brand..."
                    />
                    <Button type="submit" variant="outline">
                        Search
                    </Button>
                </form>

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
                        <div className="overflow-x-auto rounded-lg border bg-white dark:bg-zinc-900">
                            <table className="min-w-full text-sm">
                                <thead className="border-b bg-gray-50 dark:bg-zinc-800">
                                    <tr>
                                        <th className="px-4 py-3 text-left">
                                            Logo
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                            Name
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                            Created
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {brands?.data.map((brand) => (
                                        <tr
                                            key={brand.id}
                                            className="border-b last:border-b-0"
                                        >
                                            <td className="px-4 py-3">
                                                {brand.logo_path ? (
                                                    <img
                                                        src={brand.logo_path}
                                                        alt={brand.name}
                                                        className="h-10 w-10 rounded object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-xs text-gray-500">
                                                        No logo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {brand.name}
                                            </td>
                                            <td className="px-4 py-3">
                                                {new Date(
                                                    brand.created_at,
                                                ).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        deleteBrand(brand.id)
                                                    }
                                                >
                                                    Delete
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {brands?.data.length === 0 ? (
                                <p className="p-4 text-sm text-gray-500">
                                    No brands found.
                                </p>
                            ) : null}
                        </div>
                    )}
                </Deferred>
            </div>
        </AdminLayout>
    );
}
