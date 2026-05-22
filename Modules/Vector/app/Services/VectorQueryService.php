<?php

namespace Modules\Vector\Services;

use Illuminate\Support\Facades\DB;

class VectorQueryService
{
    public function findSimilarContext(string $queryVector, int $limit = 3): array
    {
        $query = DB::connection('pgsql_vector')
            ->table('manual_vectors')
            ->selectRaw('id, content, embedding <=> ?::vector as distance', [$queryVector])
            ->orderBy('distance')
            ->limit($limit);

        return $query->get()->toArray();
    }
}
