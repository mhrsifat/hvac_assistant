<?php

namespace Tests\Fixtures\Dropshipping;

use App\Services\Api\Dropshipping\Providers\AbstractDropshippingProviderService;

class PartialInventoryDropshippingProviderService extends AbstractDropshippingProviderService
{
    public function key(): string
    {
        return 'partial_inventory';
    }

    /**
     * @return array<string, mixed>
     */
    protected function buildProduct(int $index): array
    {
        $product = parent::buildProduct($index);

        if (isset($product['skus'][0]) && is_array($product['skus'][0])) {
            $product['skus'][0]['inventory_count'] = 0;
        }

        if (isset($product['skus'][1]) && is_array($product['skus'][1])) {
            $product['skus'][1]['inventory_count'] = 7;
        }

        return $product;
    }
}
