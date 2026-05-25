<?php

namespace Modules\Vector\Services;

use Illuminate\Support\Facades\DB;

class VectorQueryService
{
    public function findSimilarContext(string $queryVector, int $brandId, ?int $hvacModelId = null, int $limit = 3): array
    {
        $query = DB::connection('pgsql_vector')
            ->table('manual_vectors')
            ->select('content', 'source_document', 'page_number')
            ->orderByRaw('embedding <=> TO_VECTOR(?)', [$queryVector])
            ->limit($limit);

        // Filter for hierarchical architecture (Brand level OR Model specific)
        $query->where(function ($q) use ($brandId, $hvacModelId) {
            if ($hvacModelId) {
                $q->where('hvac_model_id', $hvacModelId)
                    ->orWhere(function ($subQuery) use ($brandId) {
                        $subQuery->where('brand_id', $brandId)
                            ->whereNull('hvac_model_id');
                    });
            } else {
                $q->where('brand_id', $brandId)
                    ->whereNull('hvac_model_id');
            }
        });

        return $query->get()->toArray();
    }
}
