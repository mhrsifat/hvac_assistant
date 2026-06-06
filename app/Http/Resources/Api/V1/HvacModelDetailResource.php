<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HvacModelDetailResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'slug' => $this->slug,
            'brand' => [
                'slug' => $this->brand?->slug,
                'name' => $this->brand?->name,
                'logo_path' => $this->brand?->logo_path,
            ],
            'name' => $this->name,
            'model_number' => $this->model_number,
            'capacity_btu' => (string) $this->capacity_btu,
            'efficiency_rating' => $this->efficiency_rating,
            'power_spec' => $this->power_spec,
            'refrigerant_type' => $this->refrigerant_type,
            'image_path' => $this->image_path,
            // 'created_at' => $this->created_at?->toIso8601String(),
            // 'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
