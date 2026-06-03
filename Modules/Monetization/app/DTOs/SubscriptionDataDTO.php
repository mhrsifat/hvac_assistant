<?php

namespace Modules\Monetization\DTOs;

use Carbon\Carbon;

readonly class SubscriptionDataDTO
{
    public function __construct(
        public string $providerSubscriptionId,
        public string $productId,
        public Carbon $startsAt,
        public Carbon $endsAt,
        public ?Carbon $trialEndsAt,
        public array $providerMetadata = [],
    ) {}
}