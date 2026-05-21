<?php

namespace Tests\Fixtures\Dropshipping;

use App\Services\Api\Dropshipping\Providers\AbstractDropshippingProviderService;

class TimelessDropshippingProviderService extends AbstractDropshippingProviderService
{
    public function key(): string
    {
        return 'timeless';
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    protected function buildCatalog(): array
    {
        $products = parent::buildCatalog();

        foreach ($products as &$product) {
            unset(
                $product['published_at'],
                $product['created_at'],
                $product['updated_at']
            );

            if (is_array($product['provider_payload'] ?? null)) {
                unset(
                    $product['provider_payload']['published_at'],
                    $product['provider_payload']['created_at'],
                    $product['provider_payload']['updated_at']
                );
            }
        }

        unset($product);

        return $products;
    }
}
