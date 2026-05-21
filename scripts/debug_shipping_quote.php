<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Sku;
use App\Models\User;
use App\Models\ShippingAddress;

$skuCode = $argv[1] ?? 'CJDROPSH-0325F00E3DFA';
$country = $argv[2] ?? null;

/** @var User|null $user */
$user = User::query()->first();
if (! $user) {
  echo json_encode(['error' => 'no_user_found']);
  exit(1);
}

$sku = Sku::with('product')->where('code', $skuCode)->first();
if (! $sku) {
  echo json_encode(['error' => 'sku_not_found', 'sku' => $skuCode]);
  exit(1);
}

$item = ['product' => $sku->product, 'sku' => $sku, 'quantity' => 1];

/** @var ShippingAddress|null $shippingAddress */
$shippingAddress = ShippingAddress::query()->where('user_id', $user->id)->where('address_type', 'shipping')->where('is_default', true)->first();

/** @var \App\Services\Api\Store\ShippingQuoteService $service */
$service = $app->make(\App\Services\Api\Store\ShippingQuoteService::class);

$result = $service->quoteForItems($user, [$item], $shippingAddress, $country);

echo json_encode($result, JSON_PRETTY_PRINT) . PHP_EOL;
