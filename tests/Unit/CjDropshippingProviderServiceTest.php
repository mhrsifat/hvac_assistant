<?php

use App\Services\Api\Dropshipping\Providers\CjDropshippingProviderService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

uses(TestCase::class);

it('returns readable attributes and sku codes for cj product details', function (): void {
    config()->set('dropshipping.providers.cj_dropshipping', [
        'label' => 'CJ Dropshipping',
        'service' => CjDropshippingProviderService::class,
        'base_url' => 'https://developers.cjdropshipping.com',
        'credential_fields' => ['api_key'],
        'credential_env_map' => [
            'api_key' => 'CJ_DROPSHIPPING_API_KEY',
        ],
        'credentials' => [],
    ]);

    Http::fake([
        'https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken' => Http::response([
            'code' => 200,
            'result' => true,
            'message' => 'Success',
            'data' => ['accessToken' => 'token-123'],
        ], 200),
        'https://developers.cjdropshipping.com/api2.0/v1/product/query*' => Http::response([
            'code' => 200,
            'result' => true,
            'message' => 'Success',
            'data' => [
                'pid' => 'CJ-P-100',
                'productNameEn' => 'CJ Test Product',
                'sellPrice' => '9.99',
                'status' => '3',
                'variants' => [
                    [
                        'vid' => 'VID-1',
                        'variantSku' => 'CJTEST-1',
                        'variantKey' => 'Black-L',
                        'variantSellPrice' => 10.25,
                        'variantImage' => 'https://cf.cjdropshipping.com/2049/1392938159916.jpg',
                        'inventories' => null,
                    ],
                    [
                        'vid' => 'VID-2',
                        'variantSku' => 'CJTEST-2',
                        'variantKey' => 'White-M',
                        'variantSellPrice' => 11.75,
                        'inventories' => null,
                    ],
                ],
            ],
        ], 200),
        'https://developers.cjdropshipping.com/api2.0/v1/product/stock/getInventoryByPid*' => Http::response([
            'code' => 200,
            'result' => true,
            'message' => 'Success',
            'data' => [
                'variantInventories' => [
                    [
                        'vid' => 'VID-1',
                        'inventory' => [
                            ['totalInventory' => 7],
                            ['totalInventory' => 5],
                        ],
                    ],
                    [
                        'vid' => 'VID-2',
                        'inventory' => [
                            ['totalInventory' => 3],
                        ],
                    ],
                ],
            ],
        ], 200),
    ]);

    $service = app(CjDropshippingProviderService::class);
    $product = $service->findProductById(['api_key' => 'cj-test-key'], 'CJ-P-100');

    expect($product)->not->toBeNull();
    expect($product['original_url'])->toBe('https://cjdropshipping.com/product/cj-test-product-p-CJ-P-100.html');
    expect($product['attributes'])->toHaveCount(2);
    expect($product['attributes'][0]['id'])->toBe('attr_color');
    expect($product['attributes'][0]['name'])->toBe('Color');
    expect($product['attributes'][0]['type'])->toBe('image');
    expect($product['attributes'][0]['options'][0]['value'])->toBe('Black');
    expect($product['attributes'][0]['options'][0]['label'])->toBe('Black');
    expect($product['attributes'][0]['options'][0]['option_image'])->toBe('https://cf.cjdropshipping.com/2049/1392938159916.jpg');
    expect($product['attributes'][1]['id'])->toBe('attr_size');
    expect($product['attributes'][1]['type'])->toBe('text');
    expect($product['skus'][0]['provider_sku_code'])->toBe('CJTEST-1');
    expect($product['skus'][0]['attributes']['Color'])->toBe('Black');
    expect($product['skus'][0]['attributes']['Size'])->toBe('L');
    expect($product['skus'][0]['inventory_count'])->toBe(12);
});

it('preserves the raw cj option label for lower-case variant values', function (): void {
    config()->set('dropshipping.providers.cj_dropshipping', [
        'label' => 'CJ Dropshipping',
        'service' => CjDropshippingProviderService::class,
        'base_url' => 'https://developers.cjdropshipping.com',
        'credential_fields' => ['api_key'],
        'credential_env_map' => [
            'api_key' => 'CJ_DROPSHIPPING_API_KEY',
        ],
        'credentials' => [],
    ]);

    Http::fake([
        'https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken' => Http::response([
            'code' => 200,
            'result' => true,
            'message' => 'Success',
            'data' => ['accessToken' => 'token-123'],
        ], 200),
        'https://developers.cjdropshipping.com/api2.0/v1/product/query*' => Http::response([
            'code' => 200,
            'result' => true,
            'message' => 'Success',
            'data' => [
                'pid' => 'CJ-P-200',
                'productNameEn' => 'CJ Test Product',
                'sellPrice' => '9.99',
                'status' => '3',
                'variants' => [
                    [
                        'vid' => 'VID-1',
                        'variantSku' => 'CJTEST-1',
                        'variantKey' => '2black-L',
                        'variantSellPrice' => 10.25,
                        'variantImage' => 'https://cf.cjdropshipping.com/2049/1392938159916.jpg',
                        'inventories' => null,
                    ],
                ],
            ],
        ], 200),
        'https://developers.cjdropshipping.com/api2.0/v1/product/stock/getInventoryByPid*' => Http::response([
            'code' => 200,
            'result' => true,
            'message' => 'Success',
            'data' => [
                'variantInventories' => [
                    [
                        'vid' => 'VID-1',
                        'inventory' => [
                            ['totalInventory' => 7],
                        ],
                    ],
                ],
            ],
        ], 200),
    ]);

    $service = app(CjDropshippingProviderService::class);
    $product = $service->findProductById(['api_key' => 'cj-test-key'], 'CJ-P-200');

    expect($product)->not->toBeNull();
    expect($product['attributes'][0]['options'][0]['value'])->toBe('2black');
    expect($product['attributes'][0]['options'][0]['label'])->toBe('2black');
});
