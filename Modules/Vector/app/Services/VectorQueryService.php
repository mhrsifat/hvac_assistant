<?php

namespace Modules\Vectore\Services;

use Illuminate\Support\Facades\DB;

class VectorQueryService
{
    public function findSimilarContext(string $queryVector, int $brandId = null, int $limit = 3): array
    {
        $query = DB::connection('pgsql_vector')
            ->table('manual_vectors')
            ->select('content', 'source_document', 'page_number')
            ->orderByRaw('embedding <=> TO_VECTOR(?)', [$queryVector])
            ->limit($limit);

        if ($brandId) {
            $query->where('brand_id', $brandId);
        }

        return $query->get()->toArray();
    }
}