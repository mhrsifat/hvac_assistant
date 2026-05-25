<?php

namespace App\Services\Web;

use App\Models\Brand;
use App\Models\HvacModel;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

class HvacModelService
{
    public function brandOptions(): Collection
    {
        return Brand::query()
            ->select(['id', 'name'])
            ->orderBy('name')
            ->get();
    }

    public function paginateForIndex(?string $search = null, ?int $brandId = null): LengthAwarePaginator
    {
        return HvacModel::query()
            ->with(['brand:id,name'])
            ->when($brandId, function ($query, $value): void {
                $query->where('brand_id', $value);
            })
            ->when($search, function ($query, $searchTerm): void {
                $query->where(function ($nestedQuery) use ($searchTerm): void {
                    $nestedQuery
                        ->where('name', 'like', "%{$searchTerm}%")
                        ->orWhere('model_number', 'like', "%{$searchTerm}%");
                });
            })
            ->latest('id')
            ->paginate(10)
            ->withQueryString();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?UploadedFile $image): HvacModel
    {
        unset($data['image']);

        if ($image) {
            $data['image_path'] = $image->store('hvac-models/images', 'public');
        }

        return HvacModel::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(HvacModel $hvacModel, array $data, ?UploadedFile $image, bool $removeImage = false): HvacModel
    {
        unset($data['image'], $data['remove_image']);

        if ($removeImage) {
            $this->deleteStoredFile($hvacModel->getRawOriginal('image_path'));
            $data['image_path'] = null;
        }

        if ($image) {
            $this->deleteStoredFile($hvacModel->getRawOriginal('image_path'));
            $data['image_path'] = $image->store('hvac-models/images', 'public');
        }

        $hvacModel->fill($data)->save();

        return $hvacModel;
    }

    public function delete(HvacModel $hvacModel): void
    {
        $this->deleteStoredFile($hvacModel->getRawOriginal('image_path'));
        $hvacModel->delete();
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
