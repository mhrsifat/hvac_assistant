import type { PropsWithChildren } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import SettingsLayout from '@/layouts/settings/layout';

type AdminSettingsLayoutProps = PropsWithChildren<{
    title: string;
}>;

export default function AdminSettingsLayout({
    children,
    title,
}: AdminSettingsLayoutProps) {
    return (
        <AdminLayout title={title}>
            <SettingsLayout>{children}</SettingsLayout>
        </AdminLayout>
    );
}
