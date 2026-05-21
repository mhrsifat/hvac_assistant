<?php

use App\Providers\AppServiceProvider;
use App\Providers\FortifyServiceProvider;
use Yajra\DataTables\DataTablesServiceProvider;

return [
    AppServiceProvider::class,
    FortifyServiceProvider::class,
    DataTablesServiceProvider::class,
];
