<?php

namespace Modules\Monetization\Listeners;

use Carbon\Carbon;
use Illuminate\Events\Dispatcher;
use Illuminate\Support\Facades\Log;
use Modules\Monetization\Models\Subscription;

// Apple Events (V2)
use Imdhemy\Purchases\Events\AppStore\Subscribed as AppleSubscribed;
use Imdhemy\Purchases\Events\AppStore\DidRenew as AppleDidRenew;
use Imdhemy\Purchases\Events\AppStore\Expired as AppleExpired;

// Google Events
use Imdhemy\Purchases\Events\GooglePlay\SubscriptionPurchased as GooglePurchased;
use Imdhemy\Purchases\Events\GooglePlay\SubscriptionRenewed as GoogleRenewed;
use Imdhemy\Purchases\Events\GooglePlay\SubscriptionExpired as GoogleExpired;
use Imdhemy\Purchases\Events\GooglePlay\SubscriptionCanceled as GoogleCanceled;

class SubscriptionEventSubscriber
{
  /**
   * Generic handler so this class can be registered as a listener
   * in the package `eventListeners` mapping. The package will
   * instantiate this class and call `handle($event)` for each
   * configured event.
   */
  public function handle($event): void
  {
    $eventClass = get_class($event);

    switch ($eventClass) {
      case AppleSubscribed::class:
      case AppleDidRenew::class:
        $this->handleAppleActive($event);
        break;

      case AppleExpired::class:
        $this->handleAppleExpired($event);
        break;

      case GooglePurchased::class:
      case GoogleRenewed::class:
        $this->handleGoogleActive($event);
        break;

      case GoogleExpired::class:
      case GoogleCanceled::class:
        $this->handleGoogleInactive($event);
        break;

      default:
        // Unknown event — ignore silently
        break;
    }
  }
  /**
   * Handle Apple Subscription Renewed/Started
   */
  public function handleAppleActive($event): void
  {
    try {
      // V2 Payload থেকে ডেটা বের করা
      $payload = $event->getServerNotification();
      $transactionInfo = $payload->getData()->getSignedTransactionInfo();
      $originalTransactionId = $transactionInfo->getOriginalTransactionId();
      $expiresDateMs = $transactionInfo->getExpiresDate();

      Subscription::where('provider_subscription_id', $originalTransactionId)
        ->update([
          'status' => 'active',
          'ends_at' => Carbon::createFromTimestampMs($expiresDateMs),
        ]);

      Log::info("LIAP Event: Apple Subscription Active for {$originalTransactionId}");
    } catch (\Exception $e) {
      Log::error("LIAP Event Error (Apple Active): " . $e->getMessage());
    }
  }

  /**
   * Handle Apple Subscription Expired
   */
  public function handleAppleExpired($event): void
  {
    try {
      $payload = $event->getServerNotification();
      $originalTransactionId = $payload->getData()->getSignedTransactionInfo()->getOriginalTransactionId();

      Subscription::where('provider_subscription_id', $originalTransactionId)
        ->update(['status' => 'expired']);

      Log::info("LIAP Event: Apple Subscription Expired for {$originalTransactionId}");
    } catch (\Exception $e) {
      Log::error("LIAP Event Error (Apple Expired): " . $e->getMessage());
    }
  }

  /**
   * Handle Google Subscription Renewed/Started
   */
  public function handleGoogleActive($event): void
  {
    try {
      $notification = $event->getServerNotification();
      $purchaseToken = $notification->getSubscriptionNotification()->getPurchaseToken();

      Subscription::where('provider_subscription_id', $purchaseToken)
        ->update(['status' => 'active']);

      Log::info("LIAP Event: Google Subscription Active for {$purchaseToken}");
    } catch (\Exception $e) {
      Log::error("LIAP Event Error (Google Active): " . $e->getMessage());
    }
  }

  /**
   * Handle Google Subscription Expired/Canceled
   */
  public function handleGoogleInactive($event): void
  {
    try {
      $notification = $event->getServerNotification();
      $purchaseToken = $notification->getSubscriptionNotification()->getPurchaseToken();

      // Cancelled হলে cancelled স্ট্যাটাস, নাহলে expired
      $status = ($event instanceof GoogleCanceled) ? 'cancelled' : 'expired';

      Subscription::where('provider_subscription_id', $purchaseToken)
        ->update(['status' => $status]);

      Log::info("LIAP Event: Google Subscription {$status} for {$purchaseToken}");
    } catch (\Exception $e) {
      Log::error("LIAP Event Error (Google Inactive): " . $e->getMessage());
    }
  }

  /**
   * Register the listeners for the subscriber.
   */
  public function subscribe(Dispatcher $events): void
  {
    // Bind Apple Events
    $events->listen(AppleSubscribed::class, [self::class, 'handleAppleActive']);
    $events->listen(AppleDidRenew::class,   [self::class, 'handleAppleActive']);
    $events->listen(AppleExpired::class,    [self::class, 'handleAppleExpired']);

    // Bind Google Events
    $events->listen(GooglePurchased::class, [self::class, 'handleGoogleActive']);
    $events->listen(GoogleRenewed::class,   [self::class, 'handleGoogleActive']);
    $events->listen(GoogleExpired::class,   [self::class, 'handleGoogleInactive']);
    $events->listen(GoogleCanceled::class,  [self::class, 'handleGoogleInactive']);
  }
}
