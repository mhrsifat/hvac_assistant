import AdminLayout from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Deferred, Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Eye } from 'lucide-react';
import { FormEvent, useState } from 'react';

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

type PaginatedResponse<T> = {
    data: T[];
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
    const [search, setSearch] = useState(filters.search ?? '');
    const [brandFilter, setBrandFilter] = useState(
        filters.brand_id ? String(filters.brand_id) : '',
    );
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
            },
        });
    };

    const applyFilters = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        router.get(
            '/hvac-models',
            {
                search,
                brand_id: brandFilter || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const deleteModel = (modelId: number): void => {
        router.delete(`/hvac-models/${modelId}`, {
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout title="HVAC Models">
            <Head title="HVAC Models" />

            <div className="space-y-6">
                <h1 className="text-2xl font-semibold">HVAC Models</h1>

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
                    className="grid gap-3 rounded-lg border bg-white p-4 dark:bg-zinc-900 md:grid-cols-3"
                >
                    <select
                        className="h-10 rounded-md border px-3"
                        value={createForm.data.brand_id}
                        onChange={(event) =>
                            createForm.setData('brand_id', event.target.value)
                        }
                    >
                        <option value="">Select brand</option>
                        {brands.map((brand) => (
                            <option key={brand.id} value={brand.id}>
                                {brand.name}
                            </option>
                        ))}
                    </select>
                    <Input
                        value={createForm.data.name}
                        onChange={(event) =>
                            createForm.setData('name', event.target.value)
                        }
                        placeholder="Model name"
                    />
                    <Input
                        value={createForm.data.model_number}
                        onChange={(event) =>
                            createForm.setData('model_number', event.target.value)
                        }
                        placeholder="Model number"
                    />
                    <Input
                        type="number"
                        value={createForm.data.capacity_btu}
                        onChange={(event) =>
                            createForm.setData('capacity_btu', event.target.value)
                        }
                        placeholder="Capacity BTU"
                    />
                    <Input
                        value={createForm.data.efficiency_rating}
                        onChange={(event) =>
                            createForm.setData(
                                'efficiency_rating',
                                event.target.value,
                            )
                        }
                        placeholder="Efficiency rating"
                    />
                    <Input
                        value={createForm.data.power_spec}
                        onChange={(event) =>
                            createForm.setData('power_spec', event.target.value)
                        }
                        placeholder="Power spec"
                    />
                    <Input
                        value={createForm.data.refrigerant_type}
                        onChange={(event) =>
                            createForm.setData(
                                'refrigerant_type',
                                event.target.value,
                            )
                        }
                        placeholder="Refrigerant type"
                    />
                    <Input
                        type="file"
                        accept="image/*"
                        onChange={(event) =>
                            createForm.setData(
                                'image',
                                event.target.files?.[0] ?? null,
                            )
                        }
                    />
                    <Button type="submit" disabled={createForm.processing}>
                        {createForm.processing
                            ? 'Creating...'
                            : 'Create HVAC Model'}
                    </Button>
                </form>

                <form onSubmit={applyFilters} className="grid gap-3 md:grid-cols-3">
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search model..."
                    />
                    <select
                        className="h-10 rounded-md border px-3"
                        value={brandFilter}
                        onChange={(event) => setBrandFilter(event.target.value)}
                    >
                        <option value="">All brands</option>
                        {brands.map((brand) => (
                            <option key={brand.id} value={brand.id}>
                                {brand.name}
                            </option>
                        ))}
                    </select>
                    <Button type="submit" variant="outline">
                        Apply Filter
                    </Button>
                </form>

                <Deferred
                    data="models"
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
                                            Brand
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                            Name
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                            Model #
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                            BTU
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {models?.data.map((model) => (
                                        <tr
                                            key={model.id}
                                            className="border-b last:border-b-0"
                                        >
                                            <td className="px-4 py-3">
                                                {model.brand?.name ?? '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {model.name}
                                            </td>
                                            <td className="px-4 py-3">
                                                {model.model_number ?? '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {model.capacity_btu ?? '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-2">
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        <Link
                                                            href={`/hvac-models/${model.id}`}
                                                            prefetch
                                                            className="gap-2"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                            View
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() =>
                                                            deleteModel(model.id)
                                                        }
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {models?.data.length === 0 ? (
                                <p className="p-4 text-sm text-gray-500">
                                    No models found.
                                </p>
                            ) : null}
                        </div>
                    )}
                </Deferred>
            </div>
        </AdminLayout>
    );
}
