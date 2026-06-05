<?php

namespace App\Http\Controllers\Api\V1;

use App\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\HvacModelDetailResource;
use App\Http\Resources\Api\V1\HvacModelResource;
use App\Models\HvacModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HvacModelController extends Controller
{
    use ApiResponse;

    /**
     * Get paginated, searchable list of HVAC models.
     * Searching by brand name also returns matching models.
     */
    public function index(Request $request): JsonResponse
    {
        $models = HvacModel::query()
            ->with('brand')
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', '%'.$search.'%')
                        ->orWhere('model_number', 'like', '%'.$search.'%')
                        ->orWhereHas('brand', function ($brandQuery) use ($search) {
                            $brandQuery->where('name', 'like', '%'.$search.'%');
                        });
                });
            })
            ->latest()
            ->paginate($request->input('per_page', 15));

        return $this->success(200, 'HVAC models fetched successfully.', [
            'models' => HvacModelResource::collection($models),
            'pagination' => [
                'current_page' => $models->currentPage(),
                'last_page' => $models->lastPage(),
                'per_page' => $models->perPage(),
                'total' => $models->total(),
            ],
        ]);
    }

    /**
     * Get full details of a single HVAC model by slug.
     */
    public function show(string $slug): JsonResponse
    {
        $model = HvacModel::query()
            ->with('brand')
            ->where('slug', $slug)
            ->first();

        if (! $model) {
            return $this->error(404, 'HVAC model not found.');
        }

        return $this->success(200, 'HVAC model details fetched successfully.', [
            'model' => new HvacModelDetailResource($model),
        ]);
    }
}
