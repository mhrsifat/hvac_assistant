# LIAP — Laravel In-App Purchases (Monetization)

This document is a concise, practical reference for using the Imdhemy LIAP package in this application. It covers installation, configuration, credentials, routing, validation examples for App Store and Google Play, real-time notifications, testing, and deployment considerations.

## Table of Contents

- Summary
- Installation & Configuration
- Credentials & Auth
- Routing & Signed URLs
- App Store: Products & Subscriptions
- Google Play: Products & Subscriptions
- Real-time Notifications & Event Listeners
- Google Play: Region Prices
- Testing & Mocking
- Usage Outside Laravel
- References

## Summary

LIAP centralizes receipt verification and webhook handling for App Store and Google Play. Use it to verify receipts, process server notifications, and mock provider responses in tests.

## Installation & Configuration

1. Install via Composer:

```bash
composer require imdhemy/laravel-purchases
```

2. Publish the config:

```bash
php artisan liap:config:publish
```

This creates `config/liap.php`. Key config options:

- `routing`: Signed URL, middleware, prefix.
- `google_play_package_name`: Default Android package name.
- `appstore_password`: App Store shared secret.
- `eventListeners`: Map provider events to local listeners.
- App Store test keys for server notifications.

## Credentials & Authentication

- App Store: add the App-Specific Shared Secret to your `.env`:

```ini
APPSTORE_PASSWORD=your_generated_shared_secret_here
```

- Google Play: create a GCP service account, grant Pub/Sub roles, download the JSON key and set its path:

```ini
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/google-service-account.json
```

Allow up to ~36 hours for new Google credentials to fully propagate.

## Routing & Signed URLs

LIAP exposes an endpoint for provider notifications. Default routes accept `?provider=google-play` or `?provider=app-store` at `/liap/notifications`.

Example routing options in `config/liap.php`:

```php
'routing' => [
    'signed' => true, // require signed URLs
    'middleware' => 'api',
    'prefix' => 'liap',
],
```

Generate a signed URL (bound to `APP_URL`):

```bash
php artisan liap:url
```

Use the output URL in App Store Connect (Server Notifications) or Google Cloud Pub/Sub push endpoint.

## App Store: Products & Subscriptions

- Validate one-time purchases (consumable/non-consumable): verify the base64 receipt server-side and check `in_app` entries.

Example controller:

```php
namespace App\Http\Controllers;

use Imdhemy\Purchases\Facades\Product;
use Illuminate\Http\JsonResponse;

class AppStoreProductController extends Controller
{
    public function verifyPurchase(string $receipt, string $productId): JsonResponse
    {
        $response = Product::appStore()->receiptData($receipt)->verifyReceipt();
        $inAppList = $response->getReceipt()->getInApp();

        foreach ($inAppList as $inApp) {
            if ($inApp->getProductId() === $productId) {
                return response()->json(['message' => 'Purchase verified']);
            }
        }

        return response()->json(['error' => 'Product not purchased'], 404);
    }
}
```

- Validate subscriptions (renewables) using `verifyRenewable()` and inspect `getLatestReceiptInfo()` for the active transaction.

```php
use Imdhemy\Purchases\Facades\Subscription;

class AppStoreSubscriptionController extends Controller
{
    public function verifySubscription(string $receipt)
    {
        $response = Subscription::appStore()->receiptData($receipt)->verifyRenewable();

        if ($response->getStatus()->isValid()) {
            $latest = $response->getLatestReceiptInfo()[0];

            return [
                'product_id' => $latest->getProductId(),
                'transaction_id' => $latest->getTransactionId(),
                'expires_date' => $latest->getExpiresDate(),
            ];
        }

        return response()->json(['error' => 'Invalid receipt'], 400);
    }
}
```

## Google Play: Products & Subscriptions

Google Play uses `itemId` and `purchaseToken`.

Validate one-time purchases:

```php
use Imdhemy\Purchases\Facades\Product;

class GooglePlayProductController extends Controller
{
    public function verifyPurchase(string $itemId, string $purchaseToken)
    {
        $receipt = Product::googlePlay()->id($itemId)->token($purchaseToken)->get();
        return response()->json(['status' => 'verified', 'kind' => $receipt->getKind()]);
    }
}
```

Validate subscriptions:

```php
use Imdhemy\Purchases\Facades\Subscription;

class GooglePlaySubscriptionController extends Controller
{
    public function verifySubscription(string $itemId, string $purchaseToken)
    {
        $sub = Subscription::googlePlay()->id($itemId)->token($purchaseToken)->get();

        return response()->json([
            'status' => 'active',
            'expiry' => $sub->getExpiryTimeMillis(),
        ]);
    }
}
```

## Real-time Notifications & Event Listeners

Use provider push notifications to avoid polling. Add the signed LIAP URL to provider consoles.

- App Store: add signed URL in App Store Connect under App Store Server Notifications (Prod & Sandbox).
- Google Play: create a Pub/Sub topic and subscription, set delivery to Push, and add the signed LIAP URL. Grant the `google-play-developer-notifications@system.gserviceaccount.com` publisher role to your topic.

When LIAP receives a webhook it dispatches events. Register listeners in `config/liap.php` under `eventListeners`.

Example listener:

```php
namespace App\Listeners;

use Imdhemy\Purchases\Events\GooglePlay\SubscriptionRenewed;
use App\Models\UserSubscription;

class AutoRenewSubscription
{
    public function handle(SubscriptionRenewed $event): void
    {
        $data = $event->getServerNotification()->getSubscription();
        $id = $data->getUniqueIdentifier();
        $expires = $data->getExpiryTime()->getCarbon();

        $sub = UserSubscription::where('identifier', $id)->first();
        if ($sub) {
            $sub->update(['expires_at' => $expires]);
        }
    }
}
```

Register it in `config/liap.php`:

```php
'eventListeners' => [
    \Imdhemy\Purchases\Events\GooglePlay\SubscriptionRenewed::class => [
        \App\Listeners\AutoRenewSubscription::class,
    ],
],
```

Common events:

- Subscribed / SubscriptionPurchased
- DidRenew / SubscriptionRenewed
- Expired / SubscriptionExpired
- Refund / SubscriptionCanceled + SubscriptionRevoked
- GracePeriodExpired / SubscriptionInGracePeriod

Note: Google Play may require combining events (Canceled + Revoked) to detect refunds.

## Google Play: Region Prices

Use the ConvertRegionPrices service to calculate localized prices before updating Play Console pricing. Typical flow: create a `ConvertRegionPricesQuery` with a base `Money` object and call `ConvertRegionPrices::execute()`.

## Testing & Mocking

LIAP supports mocking provider responses to avoid network calls in tests. Use `ClientFactory::mock()` to return a custom Guzzle response.

Example test:

```php
use GuzzleHttp\Psr7\Response;
use Imdhemy\GooglePlay\ClientFactory;
use Imdhemy\Purchases\Facades\Subscription;

public function test_verifies_google_play_subscription()
{
    $body = [
        'kind' => 'androidpublisher#subscriptionPurchase',
        'startTimeMillis' => '1580000000000',
        'expiryTimeMillis' => '1580000000000',
        'autoRenewing' => true,
    ];

    $response = new Response(200, [], json_encode($body));
    $client = ClientFactory::mock($response);

    $receipt = Subscription::googlePlay($client)->id('test_item')->token('test_token')->get();
    $this->assertTrue($receipt->isAutoRenewing());
}
```

Triggering provider test notifications:

- App Store: `php artisan liap:apple:test-notification --sandbox`
- Google Play: use the Send Test Message button in the Play Console Pub/Sub panel.

## Usage Outside Laravel

If you need to validate App Store webhooks outside Laravel, require the standalone package and use the provided JWS parser/verifier.

```bash
composer require imdhemy/appstore-iap
```

Minimal parsing example:

```php
use Imdhemy\AppStore\Jws\Parser;
use Imdhemy\AppStore\Jws\AppStoreJwsVerifier;
use Imdhemy\AppStore\ServerNotifications\V2DecodedPayload;

$signedPayload = $_POST['signedPayload'] ?? '';
$jws = Parser::toJws($signedPayload);
$verifier = new AppStoreJwsVerifier();

if ($verifier->verify($jws)) {
    $payload = V2DecodedPayload::fromJws($jws);
    // process $payload
}
```

## References

- Imdhemy Laravel Purchases: https://github.com/imdhemy/laravel-purchases
- Google Play RTDN & Pub/Sub docs
- App Store Server Notifications docs

---

If you want, I can also:

- Extract the examples into `app/Http/Controllers` stubs, or
- Add a short deployment checklist (firewall, HTTPS, domain, APP_URL).
