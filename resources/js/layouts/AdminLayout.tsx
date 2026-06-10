import { Head, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { PropsWithChildren } from 'react';
import Header from '@/components/Admin/Header';
import Sidebar from '@/components/Admin/Sidebar';
import { cn } from '@/lib/utils';

type AdminLayoutProps = PropsWithChildren<{
    title?: string;
}>;

const getInitialMiniSidebarState = (): boolean => {
    if (typeof window === 'undefined') {
        return true;
    }

    const saved = localStorage.getItem('admin.sidebar.state');

    return saved ? saved === 'true' : window.innerWidth < 1024;
};

export default function AdminLayout({ children, title }: AdminLayoutProps) {
    const {
        props: { auth, name },
    } = usePage();
    const appName = typeof name === 'string' && name ? name : 'Laravel';
    const userRoles = Array.isArray(auth?.roles) ? auth.roles : [];
    const userPermissions = Array.isArray(auth?.permissions)
        ? auth.permissions
        : [];

    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isMiniSidebar, setIsMiniSidebar] = useState<boolean>(
        getInitialMiniSidebarState,
    );
    useEffect(() => {
        localStorage.setItem(
            'admin.sidebar.state',
            JSON.stringify(isMiniSidebar),
        );
    }, [isMiniSidebar]);

    useEffect(() => {
        if (!isMobileOpen) {
            return;
        }

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [isMobileOpen]);

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent): void => {
            if (event.key === 'Escape' && isMobileOpen) {
                setIsMobileOpen(false);
            }
        };

        window.addEventListener('keydown', handleEscape);

        return () => {
            window.removeEventListener('keydown', handleEscape);
        };
    }, [isMobileOpen]);

    useEffect(() => {
        const handleResize = (): void => {
            if (window.innerWidth >= 1024) {
                setIsMobileOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 font-sans text-gray-900 dark:bg-[#121212] dark:text-gray-100">
            <Head
                title={
                    title
                        ? `${title} - ${appName}`
                        : `Admin Dashboard - ${appName}`
                }
            />

            {isMobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/45 transition-opacity duration-300 lg:hidden"
                    onClick={() => {
                        setIsMiniSidebar(true);
                        setIsMobileOpen(false);
                    }}
                />
            )}

            <Sidebar
                isMiniSidebar={isMiniSidebar}
                setIsMiniSidebar={setIsMiniSidebar}
                isMobileOpen={isMobileOpen}
                setIsMobileOpen={setIsMobileOpen}
                userRoles={userRoles}
                userPermissions={userPermissions}
            />

            <Header
                setIsMiniSidebar={setIsMiniSidebar}
                setIsMobileOpen={setIsMobileOpen}
            />

            <main
                className={cn(
                    'relative z-10 min-h-[calc(100vh-4rem)] overflow-x-hidden p-4 transition-all duration-200 sm:p-6 lg:p-8',
                    isMiniSidebar ? 'lg:ml-0' : 'lg:ml-[260px]',
                )}
            >
                {children}
            </main>
        </div>
    );
}
