<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Chat;
use App\Models\HvacModel;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Monetization\Models\Subscription;

class DashboardController extends Controller
{
    public function index(): Response
    {
        // 30 days range
        $startDate = Carbon::now()->subDays(29)->startOfDay();

        // 1. Total Metrics
        $totalUsers = User::whereDoesntHave('roles', function ($query) {
            $query->whereIn('name', ['admin', 'super-admin']);
        })->count();
        $totalBrands = Brand::count();
        $totalModels = HvacModel::count();
        $totalChats = Chat::count();

        // 2. Chats by Status
        $chatsByStatus = Chat::select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->get();

        // 3. Time Series Data (last 30 days)
        // Generate an array of the last 30 days to ensure continuous dates even if 0
        $dates = [];
        for ($i = 0; $i < 30; $i++) {
            $dateString = Carbon::now()->subDays(29 - $i)->format('Y-m-d');
            $dates[$dateString] = [
                'date' => $dateString,
                'chats' => 0,
                'joined_users' => 0,
                'lost_users' => 0,
            ];
        }

        // 3a. Chats Over Time
        $chatsOverTime = Chat::select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as total'))
            ->where('created_at', '>=', $startDate)
            ->groupBy('date')
            ->get();

        foreach ($chatsOverTime as $chat) {
            $dateStr = $chat->date;
            if (isset($dates[$dateStr])) {
                $dates[$dateStr]['chats'] = $chat->total;
            }
        }

        // 3b. Users Joined Over Time
        $usersJoinedOverTime = User::select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as total'))
            ->whereDoesntHave('roles', function ($query) {
                $query->whereIn('name', ['admin', 'super-admin']);
            })
            ->where('created_at', '>=', $startDate)
            ->groupBy('date')
            ->get();

        foreach ($usersJoinedOverTime as $user) {
            $dateStr = $user->date;
            if (isset($dates[$dateStr])) {
                $dates[$dateStr]['joined_users'] = $user->total;
            }
        }

        // 3c. Users Lost Over Time (Cancelled Subscriptions)
        $usersLostOverTime = Subscription::select(DB::raw('DATE(cancelled_at) as date'), DB::raw('count(*) as total'))
            ->whereNotNull('cancelled_at')
            ->where('cancelled_at', '>=', $startDate)
            ->groupBy('date')
            ->get();

        foreach ($usersLostOverTime as $sub) {
            $dateStr = $sub->date;
            if (isset($dates[$dateStr])) {
                $dates[$dateStr]['lost_users'] = $sub->total;
            }
        }

        // Flatten the array to a list
        $activityOverTime = array_values($dates);

        // 4. Recent Users
        $recentUsers = User::select('id', 'first_name', 'last_name', 'email', 'avatar', 'created_at')
            ->whereDoesntHave('roles', function ($query) {
                $query->whereIn('name', ['admin', 'super-admin']);
            })
            ->latest()
            ->take(5)
            ->get();

        // 5. Recent Chats
        $recentChats = Chat::with([
            'user:id,first_name,last_name,email',
            'hvacModel:id,name,brand_id',
            'hvacModel.brand:id,name',
        ])
            ->latest()
            ->take(5)
            ->get();

        return Inertia::render('dashboard', [
            'metrics' => [
                'total_users' => $totalUsers,
                'total_brands' => $totalBrands,
                'total_models' => $totalModels,
                'total_chats' => $totalChats,
            ],
            'chats_by_status' => $chatsByStatus,
            'activity_over_time' => $activityOverTime,
            'recent_users' => Inertia::defer(fn () => $recentUsers),
            'recent_chats' => Inertia::defer(fn () => $recentChats),
        ]);
    }
}
