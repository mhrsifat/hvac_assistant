import { Head } from '@inertiajs/react';
import { Palette } from 'lucide-react';
import AppearanceTabs from '@/components/appearance-tabs';
import Heading from '@/components/heading';
import AdminSettingsLayout from '@/layouts/settings/admin-settings-layout';

export default function Appearance() {
    return (
        <AdminSettingsLayout title="Appearance settings">
            <Head title="Appearance settings" />

            <h1 className="sr-only">Appearance settings</h1>

            <div className="max-w-3xl mx-auto p-6 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-8">
                <div className="flex items-start gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-900">
                    <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-800/50 hidden sm:block">
                        <Palette className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <Heading
                            variant="small"
                            title="Appearance settings"
                            description="Customize how your dashboard looks. Switch between light, dark, or system themes."
                        />
                    </div>
                </div>

                <div className="pt-2">
                    <AppearanceTabs />
                </div>
            </div>
        </AdminSettingsLayout>
    );
}