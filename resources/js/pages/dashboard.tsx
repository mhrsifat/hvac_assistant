import { Deferred, Head, Link, router } from '@inertiajs/react';
import { Users, Tag, Box, MessageSquare, Clock, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import AdminLayout from '@/layouts/AdminLayout';

type DashboardProps = {
    metrics: {
        total_users: number;
        total_brands: number;
        total_models: number;
        total_chats: number;
    };
    chats_by_status: {
        status: string;
        total: number;
    }[];
    activity_over_time: {
        date: string;
        chats: number;
        joined_users: number;
        lost_users: number;
    }[];
    recent_users?: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
        avatar: string;
        created_at: string;
    }[];
    recent_chats?: {
        id: number;
        title: string;
        slug: string;
        status: string;
        created_at: string;
        user: { first_name: string; last_name: string; email: string };
        hvac_model: { name: string; brand: { name: string } };
    }[];
};

const COLORS = ['#10b981', '#64748b', '#f59e0b']; // emerald, slate, amber

export default function Dashboard({ metrics, chats_by_status, activity_over_time, recent_users, recent_chats }: DashboardProps) {
    // Format date for the XAxis
    const formatXAxis = (tickItem: string) => {
        const date = new Date(tickItem);

        return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`;
    };

    // 100% Seamless Silent Polling Every 5 Seconds for recent chats and users
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({
                only: ['recent_chats', 'recent_users', 'metrics', 'chats_by_status', 'activity_over_time'],
                preserveState: true,
                preserveScroll: true,
                showProgress: false, // Prevents the blue loading bar at the top
            } as any);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const statusStyles: Record<string, string> = {
        active: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
        closed: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
        limitHit: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    };

    // === Render functions to bypass Deferred component blinking ===
    const renderRecentUsers = () => (
        <div className="space-y-4 mt-2">
            {recent_users && recent_users.length > 0 ? recent_users.map(user => (
                <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={user.avatar} alt="Avatar" className="h-9 w-9 rounded-full bg-slate-100 object-cover" />
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                                {user.first_name} {user.last_name}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{user.email}</span>
                        </div>
                    </div>
                    <div className="text-xs text-slate-400">
                        {new Date(user.created_at).toLocaleDateString()}
                    </div>
                </div>
            )) : (
                <div className="text-sm text-slate-500">No recent users.</div>
            )}
        </div>
    );

    const renderRecentChats = () => (
        <div className="space-y-4 mt-2">
            {recent_chats && recent_chats.length > 0 ? recent_chats.map(chat => (
                <Link key={chat.id} href={`/chats/${chat.slug}`} className="group flex flex-col gap-2 rounded-lg border border-slate-100 dark:border-slate-800 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-col gap-1 overflow-hidden">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                {chat.title}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 truncate">
                                <span>{chat.user.first_name} {chat.user.last_name}</span>
                                <span>&bull;</span>
                                <span className="truncate">{chat.hvac_model.name} ({chat.hvac_model.brand.name})</span>
                            </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] uppercase font-bold tracking-wider shrink-0 ${statusStyles[chat.status] || ''}`}>
                            {chat.status}
                        </span>
                    </div>
                </Link>
            )) : (
                <div className="text-sm text-slate-500">No recent chats.</div>
            )}
        </div>
    );

    return (
        <AdminLayout title="Dashboard">
            <Head title="Dashboard" />

            <div className="space-y-8">
                {/* Header */}
                <section className="relative overflow-hidden rounded-2xl border bg-white dark:bg-slate-900 dark:border-slate-800 p-6 shadow-sm">
                    <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-violet-200/60 dark:bg-violet-900/40 blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-blue-200/70 dark:bg-blue-900/40 blur-3xl" />
                    <div className="relative space-y-4">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Overview</p>
                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
                            <p className="max-w-xl text-sm text-slate-600 dark:text-slate-300">
                                Welcome back. Here's a summary of the activity across your platform over the last 30 days.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Metrics Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Users className="h-16 w-16 text-blue-600 dark:text-blue-400" />
                        </div>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{metrics?.total_users ?? 0}</div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Tag className="h-16 w-16 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Brands</CardTitle>
                            <Tag className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{metrics?.total_brands ?? 0}</div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Box className="h-16 w-16 text-violet-600 dark:text-violet-400" />
                        </div>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">HVAC Models</CardTitle>
                            <Box className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{metrics?.total_models ?? 0}</div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <MessageSquare className="h-16 w-16 text-amber-600 dark:text-amber-400" />
                        </div>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Chats</CardTitle>
                            <MessageSquare className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{metrics?.total_chats ?? 0}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Grid */}
                <div className="grid gap-4 md:grid-cols-7">
                    <Card className="col-span-1 md:col-span-5 border-0 shadow-sm bg-white dark:bg-slate-900">
                        <CardHeader>
                            <CardTitle className="text-slate-900 dark:text-white">Activity Over Time (30 Days)</CardTitle>
                            <CardDescription className="dark:text-slate-400">
                                Overview of user registrations, lost users, and chats created.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="h-[350px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={activity_over_time}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:opacity-20" />
                                        <XAxis 
                                            dataKey="date" 
                                            tickFormatter={formatXAxis} 
                                            tick={{ fill: '#64748b', fontSize: 12 }} 
                                            tickMargin={10} 
                                            axisLine={false} 
                                            tickLine={false} 
                                        />
                                        <YAxis 
                                            tick={{ fill: '#64748b', fontSize: 12 }} 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tickMargin={10} 
                                        />
                                        <RechartsTooltip 
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        <Line 
                                            type="monotone" 
                                            name="Joined Users" 
                                            dataKey="joined_users" 
                                            stroke="#3b82f6" 
                                            strokeWidth={2} 
                                            dot={false}
                                            activeDot={{ r: 6 }} 
                                        />
                                        <Line 
                                            type="monotone" 
                                            name="Lost Users" 
                                            dataKey="lost_users" 
                                            stroke="#ef4444" 
                                            strokeWidth={2} 
                                            dot={false}
                                            activeDot={{ r: 6 }} 
                                        />
                                        <Line 
                                            type="monotone" 
                                            name="Chats Created" 
                                            dataKey="chats" 
                                            stroke="#8b5cf6" 
                                            strokeWidth={2} 
                                            dot={false}
                                            activeDot={{ r: 6 }} 
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="col-span-1 md:col-span-2 border-0 shadow-sm bg-white dark:bg-slate-900">
                        <CardHeader>
                            <CardTitle className="text-slate-900 dark:text-white">Chat Status</CardTitle>
                            <CardDescription className="dark:text-slate-400">
                                Distribution of all chats
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full flex justify-center items-center">
                                {chats_by_status && chats_by_status.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={chats_by_status}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={5}
                                                dataKey="total"
                                                nameKey="status"
                                            >
                                                {chats_by_status.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip 
                                                formatter={(value: any) => [value, 'Chats']}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Legend className="capitalize" formatter={(value) => <span className="capitalize text-slate-700 dark:text-slate-300">{value}</span>} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400 text-sm">
                                        No chat data available.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity Grid */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Recent Users */}
                    <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                                    <Users className="h-5 w-5 text-blue-500" />
                                    Recently Joined
                                </CardTitle>
                                <CardDescription className="dark:text-slate-400">
                                    The newest members of your platform.
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {recent_users === undefined ? (
                                <Deferred
                                    data="recent_users"
                                    fallback={<div className="h-48 flex items-center justify-center text-slate-500">Loading users...</div>}
                                >
                                    {() => renderRecentUsers()}
                                </Deferred>
                            ) : (
                                renderRecentUsers()
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Chats */}
                    <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-amber-500" />
                                    Live Recent Chats
                                </CardTitle>
                                <CardDescription className="dark:text-slate-400">
                                    The latest support threads. Updates automatically.
                                </CardDescription>
                            </div>
                            <Link href="/chats" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                                View all <ArrowRight className="h-3 w-3" />
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {recent_chats === undefined ? (
                                <Deferred
                                    data="recent_chats"
                                    fallback={<div className="h-48 flex items-center justify-center text-slate-500">Loading chats...</div>}
                                >
                                    {() => renderRecentChats()}
                                </Deferred>
                            ) : (
                                renderRecentChats()
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}