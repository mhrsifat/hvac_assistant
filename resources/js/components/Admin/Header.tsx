import {
    Bars3Icon,
    MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import GlobalSearch from '@/components/Admin/GlobalSearch';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import {
    adminMenuSections,
    filterAdminMenuSectionsByAccess,
    flattenAdminMenuSectionsForSearch,
} from '@/Config/admin/menu';
import { logout } from '@/routes';
import { edit as editProfile } from '@/routes/profile';

type HeaderProps = {
    isMiniSidebar: boolean;
    setIsMiniSidebar: Dispatch<SetStateAction<boolean>>;
    setIsMobileOpen: Dispatch<SetStateAction<boolean>>;
};

type HeaderPageProps = {
    auth?: {
        user?: {
            avatar?: string | null;
            email?: string | null;
            first_name?: string | null;
            name?: string | null;
        } | null;
        roles?: string[];
        permissions?: string[];
    };
    system?: {
        system_name?: string | null;
    };
};

export default function Header({
    isMiniSidebar,
    setIsMiniSidebar,
    setIsMobileOpen,
}: HeaderProps) {
    const {
        props: { auth, system },
    } = usePage<HeaderPageProps>();
    const displayName = auth?.user?.first_name ?? auth?.user?.name ?? 'Admin';
    const systemName = system?.system_name ?? 'Admin Dashboard';
    const userRoles = Array.isArray(auth?.roles) ? auth.roles : [];
    const userPermissions = Array.isArray(auth?.permissions)
        ? auth.permissions
        : [];

    const authorizedSections = filterAdminMenuSectionsByAccess(
        adminMenuSections,
        {
            userRoles,
            userPermissions,
        },
    );
    const searchItems = flattenAdminMenuSectionsForSearch(authorizedSections);

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const userAvatar = auth?.user?.avatar;
    const userInitial = (displayName?.trim()?.charAt(0) ?? 'A').toUpperCase();

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent): void => {
            if (event.key === 'Escape') {
                setIsProfileOpen(false);
                setIsNotificationOpen(false);
                setIsMobileSearchOpen(false);
            }
        };

        window.addEventListener('keydown', handleEscape);

        return () => {
            window.removeEventListener('keydown', handleEscape);
        };
    }, []);

    return (
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-[#202124]">
            <div className="flex h-16 items-center gap-2 px-3 sm:px-4 lg:px-6">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                        if (window.innerWidth >= 1024) {
                            setIsMiniSidebar(!isMiniSidebar);
                        } else {
                            setIsMobileOpen((prev) => !prev);
                        }
                    }}
                    className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"
                >
                    <span className="sr-only">Toggle navigation menu</span>
                    <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                </Button>

                <div className="flex items-center gap-2 pr-2">
                    <span className="flex items-center gap-2 text-xl font-semibold text-gray-700 dark:text-gray-100">
                        <AppLogoIcon className="h-6 w-6 fill-orange-500" />
                        <span className="hidden sm:inline">
                            {systemName}
                        </span>
                    </span>
                </div>

                {/* <Button
          type="button"
          variant="outline"
          className="hidden items-center gap-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#3c4043] text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#4a4d51] md:inline-flex"
        >
          <AppLogoIcon className="h-4 w-4 fill-orange-500" />
          smartAgro
        </Button> */}

                {/* <div className="ml-4 hidden min-w-0 flex-1 md:block">
                    <GlobalSearch items={searchItems} />
                </div> */}

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                        setIsMobileSearchOpen((isOpen) => !isOpen);
                    }}
                    className="text-gray-500 hover:text-gray-800 md:hidden dark:text-gray-400 dark:hover:text-gray-100"
                >
                    <span className="sr-only">Open search</span>
                    <MagnifyingGlassIcon
                        className="h-6 w-6"
                        aria-hidden="true"
                    />
                </Button>

                <div className="ml-auto flex items-center gap-1">
                    {/* <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setIsNotificationOpen((isOpen) => !isOpen);
                            setIsProfileOpen(false);
                        }}
                        aria-expanded={isNotificationOpen}
                        aria-haspopup="menu"
                        aria-controls="admin-notification-menu"
                        className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"
                    >
                        <span className="sr-only">Notifications</span>
                        <BellIcon className="h-5 w-5" aria-hidden="true" />
                    </Button> */}

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setIsProfileOpen((isOpen) => !isOpen);
                            setIsNotificationOpen(false);
                        }}
                        aria-expanded={isProfileOpen}
                        aria-haspopup="menu"
                        aria-controls="admin-profile-menu"
                        className="ml-1 h-9 w-9 rounded-full bg-white p-0.5 text-gray-900 hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                    >
                        <span className="sr-only">Open profile menu</span>
                        {userAvatar ? (
                            <img
                                src={userAvatar}
                                alt={displayName}
                                className="h-8 w-8 rounded-full object-cover"
                            />
                        ) : (
                            <span aria-hidden="true" className="text-sm font-semibold">
                                {userInitial}
                            </span>
                        )}
                    </Button>
                </div>
            </div>

            {isMobileSearchOpen && (
                <div className="border-t border-gray-200 px-3 py-3 md:hidden dark:border-gray-700">
                    <GlobalSearch items={searchItems} />
                </div>
            )}

            {(isProfileOpen || isNotificationOpen) && (
                <div
                    className="fixed inset-0 z-30"
                    onClick={() => {
                        setIsProfileOpen(false);
                        setIsNotificationOpen(false);
                    }}
                ></div>
            )}

            {isNotificationOpen && (
                <div
                    id="admin-notification-menu"
                    className="absolute right-14 z-40 mt-1 w-[22rem] overflow-hidden rounded-md border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-[#3c4043]"
                >
                    <div className="border-b border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 dark:border-gray-700 dark:text-gray-100">
                        Notifications
                    </div>
                    <div className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        No notifications
                    </div>
                    <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
                        <Button
                            type="button"
                            variant="outline"
                            className="border-[#1a73e8] text-[#1a73e8] hover:bg-blue-50 dark:border-[#8ab4f8] dark:text-[#8ab4f8] dark:hover:bg-blue-900/30"
                        >
                            See all notifications
                        </Button>
                    </div>
                </div>
            )}

            {isProfileOpen && (
                <div
                    id="admin-profile-menu"
                    className="absolute right-3 z-40 mt-1 w-[25rem] overflow-hidden rounded-md border border-gray-200 bg-white shadow-2xl sm:right-6 dark:border-gray-700 dark:bg-[#3c4043]"
                >
                    <div className="flex items-center gap-4 p-4">
                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gray-100 p-1 text-2xl font-semibold text-gray-900 dark:bg-gray-800 dark:text-white">
                            {userAvatar ? (
                                <img
                                    src={userAvatar}
                                    alt={displayName}
                                    className="h-full w-full rounded-full object-cover"
                                />
                            ) : (
                                <span aria-hidden="true">{userInitial}</span>
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xl font-semibold text-gray-900 dark:text-gray-100">
                                {displayName}
                            </p>
                            <p className="truncate text-sm text-gray-600 dark:text-gray-400">
                                {auth?.user?.email ?? 'admin@example.com'}
                            </p>
                            <Button
                                asChild
                                className="mt-3 bg-[#1a73e8] text-white hover:bg-blue-700 dark:bg-[#8ab4f8] dark:text-gray-900 dark:hover:bg-blue-300"
                            >
                                <Link href='/settings/account'>Manage Account</Link>
                            </Button>
                        </div>
                    </div>

                    {/* <div className="border-y border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-[#303134]">
                        <p className="text-base font-medium text-gray-800 dark:text-gray-200">
                            {displayName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {auth?.user?.email ?? 'admin@example.com'}
                        </p>
                    </div> */}

                    {/* <div className="space-y-3 p-4 text-sm text-gray-700 dark:text-gray-300">
                        <p>Google Cloud Privacy</p>
                        <p>Google Cloud Terms of Service</p>
                    </div> */}

                    <div className="flex items-center justify-end border-t border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-[#303134]">
                        {/* <Button
                            type="button"
                            variant="outline"
                            className="border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-transparent dark:text-gray-200 dark:hover:bg-[#3c4043]"
                        >
                            Add account
                        </Button> */}

                        <Button
                            variant="outline"
                            className="border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-transparent dark:text-gray-200 dark:hover:bg-[#3c4043]"
                            asChild
                        >
                            <Link href={logout()} method="post" as="button">
                                Sign out
                            </Link>
                        </Button>
                    </div>
                </div>
            )}
        </header>
    );
}
