<?php

namespace App\Http\Controllers\Api\User;

use App\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderEvent;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SellerOrderController extends Controller
{
    use ApiResponse;

    /**
     * List orders for products added by the seller
     */
    public function index(Request $request): JsonResponse
    {
        $sellerId = $request->user()->id;
        $perPage = max(1, min((int) $request->query('per_page', 15), 100));
        $status = trim((string) $request->query('status', ''));
        $paymentStatus = trim((string) $request->query('payment_status', ''));
        $fulfillmentStatus = trim((string) $request->query('fulfillment_status', ''));
        $monthYear = trim((string) $request->query('month_year', ''));

        $parsedMonthYear = null;

        if ($monthYear !== '') {
            try {
                $parsedMonthYear = Carbon::createFromFormat('M Y', ucwords(strtolower($monthYear)))->startOfMonth();
            } catch (\Throwable $exception) {
                return $this->error(422, 'Invalid month_year format. Use values like "Jan 2025".');
            }
        }

        $orders = Order::query()
            ->whereHas('items.product', function ($query) use ($sellerId) {
                $query->where('seller_id', $sellerId);
            })
            ->when($status !== '', function ($query) use ($status): void {
                $query->where('status', $status);
            })
            ->when($paymentStatus !== '', function ($query) use ($paymentStatus): void {
                $query->where('payment_status', $paymentStatus);
            })
            ->when($fulfillmentStatus !== '', function ($query) use ($fulfillmentStatus): void {
                $query->where('fulfillment_status', $fulfillmentStatus);
            })
            ->when($parsedMonthYear !== null, function ($query) use ($parsedMonthYear): void {
                $query
                    ->whereYear('created_at', (int) $parsedMonthYear->year)
                    ->whereMonth('created_at', (int) $parsedMonthYear->month);
            })
            ->with(['items' => function ($query) use ($sellerId): void {
                $query->whereHas('product', function ($productQuery) use ($sellerId): void {
                    $productQuery->where('seller_id', $sellerId);
                });
            }])
            ->latest('id')
            ->paginate($perPage);

        $mappedOrders = collect($orders->items())->map(function (Order $order): array {
            return [
                'order_number' => $order->order_number,
                'order_date' => $order->created_at->format('m/d/Y'),
                'customer_name' => $order->user->name,
                'currency' => $order->currency,
                'total' => $order->total_amount,
                'payment_status' => $order->payment_status,
                'fulfillment_status' => $order->fulfillment_status,
                'items_count' => $order->items->count(),
                'delivery_status' => $order->status,
            ];
        })->values();

        return $this->success(200, 'Seller orders retrieved successfully.', [
            'orders' => $mappedOrders,
            'pagination' => [
                'current_page' => $orders->currentPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
                'last_page' => $orders->lastPage(),
            ],
        ]);
    }

    /**
     * Show order details by order_number
     */
    public function show(Request $request, string $orderNumber): JsonResponse
    {
        $sellerId = $request->user()->id;

        $order = Order::query()
            ->where('order_number', $orderNumber)
            ->whereHas('items.product', function ($query) use ($sellerId) {
                $query->where('seller_id', $sellerId);
            })
            ->with(['events'])
            ->firstOrFail();

        $events = $order->events()
            ->orderBy('event_time', 'desc')
            ->get([
                'title',
                'description',
                'status',
                'event_time',
                'updated_at',
            ]);

        $eventsByStatus = $events->keyBy('status');

        return $this->success(200, 'Order details retrieved successfully.', [
            'order_number' => $order->order_number,
            'order_status' => $order->status,
            'payment_status' => $order->payment_status,
            'order_placed_at' => $order->placed_at?->format('M d, Y'),
            'estimated_delivery_date' => $order->estimated_delivery_date?->format('M d, Y'),
            'delivered_at' => $order->delivered_at?->format('M d, Y'),
            'timeline' => [
                $this->buildTrackingStep(
                    label: 'Order Confirmed',
                    date: $this->firstAvailableDate($eventsByStatus->get('confirmed')?->event_time, $order->placed_at),
                    completed: in_array($order->status, ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'], true),
                ),
                $this->buildTrackingStep(
                    label: 'Shipped',
                    date: $eventsByStatus->get('shipped')?->event_time,
                    completed: in_array($order->status, ['shipped', 'out_for_delivery', 'delivered'], true),
                ),
                $this->buildTrackingStep(
                    label: 'Out for Delivery',
                    date: $eventsByStatus->get('out_for_delivery')?->event_time,
                    completed: $order->status === 'delivered',
                ),
                $this->buildTrackingStep(
                    label: 'Delivered',
                    date: $order->delivered_at ?? $eventsByStatus->get('delivered')?->event_time,
                    completed: $order->status === 'delivered',
                ),
            ],
            'events' => $events->map(function ($event): array {
                return [
                    'description' => $event->description,
                    'event_time' => $event->event_time?->format('M d, Y \a\t h:i A'),
                ];
            })->values(),
        ]);
    }

    public function statusOverview(Request $request): JsonResponse
    {
        $sellerId = $request->user()->id;

        $orders = Order::query()
            ->whereHas('items.product', function ($query) use ($sellerId): void {
                $query->where('seller_id', $sellerId);
            })
            ->get(['status', 'fulfillment_status']);

        $overview = [
            'total_orders' => (int) $orders->count(),
            'order_fulfilled_total' => (int) $orders->filter(function (Order $order): bool {
                return $order->fulfillment_status === 'fulfilled';
            })->count(),
            'total_delivered' => (int) $orders->filter(function (Order $order): bool {
                return $order->status === 'delivered';
            })->count(),
            'total_return' => (int) $orders->filter(function (Order $order): bool {
                return in_array($order->status, ['returned', 'return_requested', 'refund_requested'], true)
                    || $order->fulfillment_status === 'returned';
            })->count(),
        ];

        return $this->success(200, 'Seller order overview fetched successfully.', [
            'overview' => $overview,
        ]);
    }

    public function eventList(Request $request): JsonResponse
    {
        return $this->success(200, 'Order event list retrieved successfully.', [
            'events' => array_values($this->orderEventTemplates()),
        ]);
    }

    /**
     * Add a new order event
     */
    public function storeEvent(Request $request, string $orderNumber): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(array_keys($this->orderEventTemplates()))],
        ]);

        $sellerId = $request->user()->id;

        $order = Order::query()
            ->where('order_number', $orderNumber)
            ->whereHas('items.product', function ($query) use ($sellerId) {
                $query->where('seller_id', $sellerId);
            })
            ->firstOrFail();

        $eventTemplate = $this->orderEventTemplates()[$validated['status']];

        $event = OrderEvent::query()->create([
            'order_id' => $order->id,
            'status' => $validated['status'],
            'title' => $eventTemplate['title'],
            'description' => $eventTemplate['description'],
            'event_time' => now(),
            'created_by_user_id' => $sellerId,
        ]);

        // if shipped then fulfillment status should be updated to fulfilled
        if ($validated['status'] === 'shipped') {
            $order->update(['fulfillment_status' => 'fulfilled']);
        }

        // Optionally update the global order status
        $order->update(['status' => $validated['status']]);

        return $this->success(201, 'Order event created successfully.', $event);
    }

    /**
     * @return array<string, array{status: string, title: string, description: string}>
     */
    private function orderEventTemplates(): array
    {
        return [
            'processing' => [
                'status' => 'processing',
                'title' => 'Order Processing',
                'description' => 'The order is currently being prepared for fulfillment.',
            ],
            'packed' => [
                'status' => 'packed',
                'title' => 'Order Packed',
                'description' => 'The order has been packed and is ready to ship.',
            ],
            'shipped' => [
                'status' => 'shipped',
                'title' => 'Order Shipped',
                'description' => 'The order has been handed over to the courier.',
            ],
            'out_for_delivery' => [
                'status' => 'out_for_delivery',
                'title' => 'Out for Delivery',
                'description' => 'The order is on the way to the customer.',
            ],
            'delivered' => [
                'status' => 'delivered',
                'title' => 'Order Delivered',
                'description' => 'The order has been successfully delivered to the customer.',
            ],
            'return_requested' => [
                'status' => 'return_requested',
                'title' => 'Return Requested',
                'description' => 'The customer has requested a return for this order.',
            ],
            'returned' => [
                'status' => 'returned',
                'title' => 'Order Returned',
                'description' => 'The returned order has been received and processed.',
            ],
            'refund_requested' => [
                'status' => 'refund_requested',
                'title' => 'Refund Requested',
                'description' => 'A refund has been requested for this order.',
            ],
            'cancelled' => [
                'status' => 'cancelled',
                'title' => 'Order Cancelled',
                'description' => 'The order has been cancelled.',
            ],
        ];
    }

    /**
     * @param  string  $status
     * @param  \DateTimeInterface|null  $date
     * @param  bool  $active
     * @param  string  $date_label
     * @return array<string, mixed>
     */
    private function buildTrackingStep(
        string $label,
        mixed $date,
        bool $completed,
    ): array {
        return [
            'label' => $label,
            'date' => $date instanceof \DateTimeInterface ? $date->format(\DateTimeInterface::ATOM) : null,
            'completed' => $completed,
        ];
    }

    private function firstAvailableDate(mixed ...$candidates): mixed
    {
        foreach ($candidates as $candidate) {
            if ($candidate !== null) {
                return $candidate;
            }
        }

        return null;
    }
}
