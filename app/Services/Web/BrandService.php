<?php

namespace App\Services\Web;

use App\Models\Brand;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class BrandService
{
    public function paginateForIndex(?string $search = null): LengthAwarePaginator
    {
        return Brand::query()
            ->when($search, function ($query, $searchTerm): void {
                $query->where('name', 'like', "%{$searchTerm}%");
            })
            ->latest('id')
            ->paginate(10)
            ->withQueryString();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?UploadedFile $logo): Brand
    {
        unset($data['logo']);

        if ($logo) {
            $data['logo_path'] = $logo->store('brands/logos', 'public');
        }

        return Brand::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Brand $brand, array $data, ?UploadedFile $logo, bool $removeLogo = false): Brand
    {
        unset($data['logo'], $data['remove_logo']);

        if ($removeLogo) {
            $this->deleteStoredFile($brand->getRawOriginal('logo_path'));
            $data['logo_path'] = null;
        }

        if ($logo) {
            $this->deleteStoredFile($brand->getRawOriginal('logo_path'));
            $data['logo_path'] = $logo->store('brands/logos', 'public');
        }

        $brand->fill($data)->save();

        return $brand;
    }

    public function delete(Brand $brand): void
    {
        $this->deleteStoredFile($brand->getRawOriginal('logo_path'));
        $brand->delete();
    }

    private function deleteStoredFile(?string $path): void
    {
        if (blank($path)) {
            return;
        }

        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }
}
