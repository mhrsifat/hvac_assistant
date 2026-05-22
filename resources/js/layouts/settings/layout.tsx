import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';
import { GlobeIcon, User } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { useCallback, useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editProfile } from '@/routes/profile';
import type { NavItem } from '@/types';

type SettingsNavItem = Omit<NavItem, 'href'> & {
    href?: NavItem['href'];
    children?: SettingsNavItem[];
    relatedRoutes?: string[];
};

const sidebarNavItems: SettingsNavItem[] = [
    {
        title: 'Account settings',
        href: '/settings/account',
        icon: User,
        relatedRoutes: [
            '/settings/account',
            '/settings/password',
            '/settings/appearance',
            toUrl(editProfile()),
        ],
    },
    {
        title: 'Integration settings',
        icon: GlobeIcon,
        children: [
            {
                title: 'SMTP settings',
                href: '/settings/integration/smtp',
            },
            {
                title: 'AI settings',
                href: '/settings/integration/ai',
            },
        ],
    },
    {
        title: 'System Branding',
        href: '/settings/system',
        icon: GlobeIcon,
    },
];

const normalizePath = (value: string): string => {
    const [pathWithoutQuery] = value.split('?');
    const trimmedPath = pathWithoutQuery.replace(/\/+$/, '');

    return trimmedPath.length > 0 ? trimmedPath : '/';
};

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { currentUrl } = useCurrentUrl();
    
    // Track manually toggled sections using a dictionary (Record)
    const [userToggledSections, setUserToggledSections] = useState<Record<string, boolean>>({});

    const locationPath =
        currentUrl ?? (typeof window !== 'undefined' ? window.location.pathname : '/');

    const currentPath = normalizePath(locationPath);

    const isLeafItemActive = useCallback((item: SettingsNavItem): boolean => {
        if (
            item.relatedRoutes?.some(
                (route) => normalizePath(toUrl(route)) === currentPath,
            )
        ) {
            return true;
        }

        if (!item.href) {
            return false;
        }

        return normalizePath(toUrl(item.href)) === currentPath;
    }, [currentPath]);

    const hasActiveDescendant = useCallback((item: SettingsNavItem): boolean => {
        const recurse = (node: SettingsNavItem): boolean => {
            if (isLeafItemActive(node)) {
                return true;
            }

            return Boolean(
                node.children?.some((childItem) => recurse(childItem)),
            );
        };

        return recurse(item);
    }, [isLeafItemActive]);

    const toggleSection = (title: string, isActive: boolean): void => {
        setUserToggledSections((prev) => {
            // Determine if the section is currently open. 
            // If the user hasn't toggled it yet (undefined), fallback to its active state.
            const isCurrentlyOpen = prev[title] ?? isActive;
            
            return {
                ...prev,
                [title]: !isCurrentlyOpen,
            };
        });
    };

    const renderNavItem = (item: SettingsNavItem, depth = 0) => {
        const hasChildren = Boolean(item.children?.length);
        const isActive = hasChildren ? hasActiveDescendant(item) : isLeafItemActive(item);
        
        // Determine the open state directly during render
        const isOpen = hasChildren ? (userToggledSections[item.title] ?? isActive) : false;

        return (
            <div key={`${item.title}-${depth}`} className="space-y-1">
                {hasChildren ? (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => toggleSection(item.title, isActive)}
                        className={cn(
                            'w-full justify-between gap-3 rounded-lg px-4 h-10 font-medium text-muted-foreground hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-50',
                            isActive &&
                            'bg-zinc-100 text-zinc-950 font-semibold shadow-sm dark:bg-zinc-900 dark:text-zinc-50',
                            depth > 0 && 'pl-3',
                        )}
                    >
                        <span className="flex items-center gap-3 truncate">
                            {item.icon ? (
                                <item.icon className="h-4 w-4 shrink-0 text-muted-foreground/70 transition-colors" />
                            ) : null}
                            <span className="truncate">{item.title}</span>
                        </span>

                        <ChevronRightIcon
                            className={cn(
                                'h-4 w-4 shrink-0 transition-transform duration-200',
                                isOpen ? 'rotate-90' : '',
                            )}
                            aria-hidden="true"
                        />
                    </Button>
                ) : (
                    <Button
                        size="sm"
                        variant="ghost"
                        asChild
                        className={cn(
                            'w-auto lg:w-full justify-start gap-3 px-4 h-10 font-medium text-muted-foreground rounded-lg transition-all duration-200 whitespace-nowrap',
                            isActive &&
                            'bg-zinc-100 text-zinc-950 font-semibold shadow-sm dark:bg-zinc-900 dark:text-zinc-50',
                            depth > 0 && 'pl-3',
                        )}
                    >
                        <Link href={item.href!}>
                            {item.icon ? (
                                <item.icon className="h-4 w-4 shrink-0 text-muted-foreground/70 transition-colors" />
                            ) : null}
                            {item.title}
                        </Link>
                    </Button>
                )}

                {hasChildren && isOpen ? (
                    <div className="ml-3 space-y-1 border-l border-zinc-200 pl-3 dark:border-zinc-800">
                        {item.children?.map((childItem) =>
                            renderNavItem(childItem, depth + 1),
                        )}
                    </div>
                ) : null}
            </div>
        );
    };

    return (
        <div className="max-w-6xl px-4 space-y-8">
            <div className="pb-2 border-b border-zinc-100 dark:border-zinc-900">
                <Heading
                    title="Settings"
                    description="Manage your profile, security, and interface preferences."
                />
            </div>

            <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
                <aside className="w-full shrink-0 lg:w-64">
                    <nav
                        className="flex flex-row gap-1 overflow-x-auto pb-2 no-scrollbar lg:flex-col lg:pb-0"
                        aria-label="Settings"
                    >
                        {sidebarNavItems.map((item) => renderNavItem(item))}
                    </nav>
                </aside>

                <Separator className="my-2 lg:hidden" />

                <div className="min-w-0 flex-1">
                    <section className="space-y-6">{children}</section>
                </div>
            </div>
        </div>
    );
}