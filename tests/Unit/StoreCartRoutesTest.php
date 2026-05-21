<?php

use Illuminate\Http\Request;
use Illuminate\Routing\Route as LaravelRoute;
use Tests\TestCase;

uses(TestCase::class);

function matchRoute(string $method, string $uri): LaravelRoute
{
    return app('router')->getRoutes()->match(Request::create($uri, $method));
}

test('store cart routes are registered and protected by auth api middleware', function () {
    $expectedRoutes = [
        ['method' => 'GET', 'uri' => '/api/store/cart', 'action' => 'App\\Http\\Controllers\\Api\\Store\\CartController@index'],
        ['method' => 'POST', 'uri' => '/api/store/cart/items', 'action' => 'App\\Http\\Controllers\\Api\\Store\\CartController@store'],
        ['method' => 'PUT', 'uri' => '/api/store/cart/items/SKU-123', 'action' => 'App\\Http\\Controllers\\Api\\Store\\CartController@update'],
        ['method' => 'DELETE', 'uri' => '/api/store/cart/items/SKU-123', 'action' => 'App\\Http\\Controllers\\Api\\Store\\CartController@destroy'],
        ['method' => 'DELETE', 'uri' => '/api/store/cart/items', 'action' => 'App\\Http\\Controllers\\Api\\Store\\CartController@clear'],
    ];

    foreach ($expectedRoutes as $definition) {
        $route = matchRoute($definition['method'], $definition['uri']);

        expect($route->getActionName())->toBe($definition['action']);
        expect($route->gatherMiddleware())->toContain('auth:api');
    }
});
