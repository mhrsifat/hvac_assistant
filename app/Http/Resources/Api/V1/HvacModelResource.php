<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HvacModelResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'slug' => $this->slug,
            'brand_name' => $this->brand?->name,
            'name' => $this->name,
            'model_number' => $this->model_number,
            'image_path' => $this->image_path,
            'capacity_btu' => $this->capacity_btu,
        ];
    }
}
