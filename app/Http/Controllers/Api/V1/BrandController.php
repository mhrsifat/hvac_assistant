<?php

namespace App\Http\Controllers\Api\V1;

use App\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\BrandResource;
use App\Models\Brand;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BrandController extends Controller
{
    use ApiResponse;

    /**
     * Get paginated, searchable list of brands with model count.
     */
    public function index(Request $request): JsonResponse
    {
        $brands = Brand::query()
            ->withCount('hvacModels')
            ->when($request->filled('search'), function ($query) use ($request) {
                $query->where('name', 'like', '%'.$request->input('search').'%');
            })
            ->latest()
            ->paginate($request->input('per_page', 15));

        return $this->success(200, 'Brands fetched successfully.', [
            'brands' => BrandResource::collection($brands),
            'pagination' => [
                'current_page' => $brands->currentPage(),
                'last_page' => $brands->lastPage(),
                'per_page' => $brands->perPage(),
                'total' => $brands->total(),
            ],
        ]);
    }
}
