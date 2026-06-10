import { ChevronRightIcon, ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline';
import { Link, router } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { Button } from '@/components/ui/button';
import { getThemeConfig } from '@/Config/theme';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import {
    adminMenuSections,
    filterAdminMenuSectionsByAccess,
} from '../../Config/admin/menu';
import type { AdminMenuItem } from '../../Config/admin/menu';

type SidebarProps = {
    isMiniSidebar: boolean;
    setIsMiniSidebar: Dispatch<SetStateAction<boolean>>;
    isMobileOpen: boolean;
    setIsMobileOpen: Dispatch<SetStateAction<boolean>>;
    userRoles: string[];
    userPermissions: string[];
};

const OPEN_MENUS_STORAGE_KEY = 'admin.openMenus';
const SELECTED_ITEM_STORAGE_KEY = 'admin.selectedMenuItem';

const parseStoredOpenMenus = (value: string | null): string[] => {
    if (!value) {
        return [];
    }

    try {
        const parsedValue: unknown = JSON.parse(value);

        if (!Array.isArray(parsedValue)) {
            return [];
        }

        return parsedValue.filter(
            (menuId): menuId is string => typeof menuId === 'string',
        );
    } catch {
        return [];
    }
};

const normalizePath = (href: string): string => {
    const trimmedPath = href.replace(/\/+$/, '');

    return trimmedPath.length > 0 ? trimmedPath : '/';
};

const collectHrefPaths = (items: AdminMenuItem[]): string[] => {
    return items.flatMap((item) => {
        const currentPath = item.href ? [normalizePath(toUrl(item.href))] : [];
        const nestedPaths = item.children
            ? collectHrefPaths(item.children)
            : [];

        return [...currentPath, ...nestedPaths];
    });
};

export default function Sidebar({
    isMiniSidebar,
    setIsMiniSidebar,
    isMobileOpen,
    setIsMobileOpen,
    userRoles,
    userPermissions,
}: SidebarProps) {
    const theme = getThemeConfig();
    const { currentUrl, isCurrentUrl } = useCurrentUrl();
    
    // --- SCROLL PRESERVATION LOGIC START ---
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const savedScrollPos = sessionStorage.getItem('admin.sidebarScrollPos');

        if (savedScrollPos && scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = parseInt(savedScrollPos, 10);
        }
    }, []);

    const handleScroll = () => {
        if (scrollContainerRef.current) {
            sessionStorage.setItem(
                'admin.sidebarScrollPos', 
                scrollContainerRef.current.scrollTop.toString()
            );
        }
    };
    // --- SCROLL PRESERVATION LOGIC END ---

    const [openMenus, setOpenMenus] = useState<string[]>(() => {
        if (typeof window === 'undefined') {
            return [];
        }

        return parseStoredOpenMenus(
            localStorage.getItem(OPEN_MENUS_STORAGE_KEY),
        );
    });
    const [selectedItemId, setSelectedItemId] = useState<string | null>(() => {
        if (typeof window === 'undefined') {
            return null;
        }

        const storedItemId = localStorage.getItem(SELECTED_ITEM_STORAGE_KEY);

        return storedItemId && storedItemId.length > 0 ? storedItemId : null;
    });

    const authorizedSections = useMemo(() => {
        return filterAdminMenuSectionsByAccess(adminMenuSections, {
            userRoles,
            userPermissions,
        });
    }, [userPermissions, userRoles]);

    const hrefPathCounts = useMemo(() => {
        const hrefPaths = collectHrefPaths(
            authorizedSections.flatMap((section) => section.items),
        );

        return hrefPaths.reduce<Map<string, number>>((pathCountMap, path) => {
            const existingCount = pathCountMap.get(path) ?? 0;
            pathCountMap.set(path, existingCount + 1);

            return pathCountMap;
        }, new Map<string, number>());
    }, [authorizedSections]);

    const normalizedCurrentPath = useMemo(() => {
        return normalizePath(currentUrl);
    }, [currentUrl]);

    useEffect(() => {
        localStorage.setItem(OPEN_MENUS_STORAGE_KEY, JSON.stringify(openMenus));
    }, [openMenus]);

    const isLeafItemActive = useCallback(
        (item: AdminMenuItem): boolean => {
            const itemHref = item.href;

            if (!itemHref) {
                return false;
            }

            // Enhanced relatedRoutes matching logic
            if (item.relatedRoutes && item.relatedRoutes.length > 0) {
                return item.relatedRoutes.some((routePattern) => {
                    // Convert route pattern (e.g. /plans/:slug) to Regex
                    const regexPattern = routePattern
                        .replace(/:[^/]+/g, '[^/]+') // Convert :slug to regex match
                        .replace(/\//g, '\\/'); // Escape forward slashes

                    const regex = new RegExp(`^${regexPattern}$`);

                    return regex.test(normalizedCurrentPath) || normalizedCurrentPath.startsWith(normalizePath(toUrl(itemHref)));
                });
            }

            const itemPath = normalizePath(toUrl(itemHref));
            const isCurrentPath = isCurrentUrl(
                itemHref,
                normalizedCurrentPath,
            );

            if (!isCurrentPath) {
                return false;
            }

            const duplicatePathCount = hrefPathCounts.get(itemPath) ?? 0;

            if (duplicatePathCount <= 1) {
                return true;
            }

            return selectedItemId === item.id;
        },
        [normalizedCurrentPath, isCurrentUrl, hrefPathCounts, selectedItemId],
    );

    const isItemActive = useCallback(
        function checkActive(item: AdminMenuItem): boolean {
            if (item.children?.length) {
                return item.children.some((childItem) =>
                    checkActive(childItem),
                );
            }

            return isLeafItemActive(item);
        },
        [isLeafItemActive],
    );

    const hasActiveDescendant = useCallback(
        function checkDescendant(item: AdminMenuItem): boolean {
            if (isItemActive(item)) {
                return true;
            }

            return Boolean(
                item.children?.some((childItem) => checkDescendant(childItem)),
            );
        },
        [isItemActive],
    );

    useEffect(() => {
        setOpenMenus((prev) => {
            const newOpenMenus = new Set(prev);
            authorizedSections.forEach((section) => {
                section.items.forEach((item) => {
                    if (item.children?.length) {
                        const hasActiveChild = item.children.some((child) =>
                            hasActiveDescendant(child),
                        );

                        if (hasActiveChild) {
                            newOpenMenus.add(item.id);
                        }
                    }
                });
            });

            return Array.from(newOpenMenus);
        });
    }, [normalizedCurrentPath, authorizedSections, hasActiveDescendant]);

    useEffect(() => {
        if (!selectedItemId) {
            localStorage.removeItem(SELECTED_ITEM_STORAGE_KEY);

            return;
        }

        localStorage.setItem(SELECTED_ITEM_STORAGE_KEY, selectedItemId);
    }, [selectedItemId]);

    const isSidebarVisible = isMobileOpen || !isMiniSidebar;

    const closeSidebarAfterNavigation = (): void => {
        setIsMobileOpen(false);

        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            setIsMiniSidebar(true);
        }
    };

    const toggleMenu = (menuId: string): void => {
        setOpenMenus((previousOpenMenus) => {
            if (previousOpenMenus.includes(menuId)) {
                return previousOpenMenus.filter((existingMenuId) => {
                    return existingMenuId !== menuId;
                });
            }

            return [...previousOpenMenus, menuId];
        });
    };

    const itemColorClasses = (isActive: boolean) =>
        cn(
            'bg-transparent text-[15px] text-gray-700 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-[#3c4043] dark:hover:text-gray-100',
            isActive && cn(theme.text, theme.activeSidebarBg),
        );

    const renderMenuItem = (item: AdminMenuItem, depth = 0) => {
        const hasChildren = Boolean(item.children?.length);
        const hasActiveChild = hasChildren && item.children?.some(hasActiveDescendant);
        const isOpen = openMenus.includes(item.id);
        const isActive = hasChildren ? Boolean(hasActiveChild) : isLeafItemActive(item);

        return (
            <li key={item.id} className="space-y-1">
                {hasChildren ? (
                    <Button
                        type="button"
                        variant="ghost"
                        className={cn(
                            baseItemClass,
                            depth === 0 ? 'min-h-11 justify-between' : 'min-h-10 justify-between text-[14px]',
                            depth > 0 && 'pl-3',
                            itemColorClasses(isActive),
                        )}
                        onClick={() => toggleMenu(item.id)}
                    >
                        <span className="flex items-center gap-3 truncate">
                            {item.icon && (
                                <item.icon
                                    className={cn(
                                        depth === 0 ? 'h-5 w-5' : 'h-4 w-4',
                                        'shrink-0 opacity-70',
                                    )}
                                    aria-hidden="true"
                                />
                            )}
                            <span className="truncate">{item.title}</span>
                        </span>
                        <ChevronRightIcon
                            className={cn(
                                'h-4 w-4 shrink-0 text-gray-600 transition-transform dark:text-gray-400',
                                isOpen ? 'rotate-90' : '',
                            )}
                            aria-hidden="true"
                        />
                    </Button>
                ) : item.href ? (
                    <Button
                        variant="ghost"
                        className={cn(
                            baseItemClass,
                            depth === 0 ? 'min-h-11' : 'min-h-10 text-[14px]',
                            depth > 0 && 'pl-3',
                            itemColorClasses(isActive),
                        )}
                        asChild
                    >
                        <Link
                            href={item.href}
                            onClick={() => {
                                setSelectedItemId(item.id);
                                closeSidebarAfterNavigation();
                            }}
                            className="flex w-full items-center"
                        >
                            {item.icon && (
                                <item.icon
                                    className={cn(
                                        depth === 0 ? 'h-5 w-5' : 'h-4 w-4',
                                        'shrink-0 opacity-70',
                                    )}
                                    aria-hidden="true"
                                />
                            )}
                            <span className="truncate">{item.title}</span>
                        </Link>
                    </Button>
                ) : (
                    <div
                        className={cn(
                            baseItemClass,
                            depth === 0 ? 'min-h-11' : 'min-h-10 text-[14px]',
                            depth > 0 && 'pl-3',
                            'text-gray-500 dark:text-gray-400',
                        )}
                    >
                        {item.icon && (
                            <item.icon
                                className={cn(
                                    depth === 0 ? 'h-5 w-5' : 'h-4 w-4',
                                    'shrink-0 opacity-70',
                                )}
                                aria-hidden="true"
                            />
                        )}
                        <span className="truncate">{item.title}</span>
                    </div>
                )}

                {hasChildren && isOpen ? (
                    <ul
                        className={cn(
                            'space-y-1 border-l border-gray-300 dark:border-gray-700',
                            depth === 0 ? 'ml-3 pl-3' : 'ml-3 pl-3',
                        )}
                    >
                        {item.children?.map((childItem) => renderMenuItem(childItem, depth + 1))}
                    </ul>
                ) : null}
            </li>
        );
    };

    const baseItemClass =
        'relative h-auto w-full rounded-lg px-3 py-2 text-left font-medium hover:bg-gray-200 flex items-center justify-start gap-3';
    const sidebarClass =
        'fixed top-16 bottom-0 left-0 z-50 w-72 lg:w-[260px] border-r border-gray-300 dark:border-gray-700 bg-[#f8f9fa] dark:bg-[#202124] shadow-sm lg:shadow-none transition-transform duration-200 flex flex-col';

    return (
        <aside
            className={cn(
                sidebarClass,
                isSidebarVisible ? 'translate-x-0' : '-translate-x-full',
            )}
        >
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 space-y-6 overflow-y-auto px-3 py-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                style={{ overflowAnchor: 'none' }}
            >
                {authorizedSections.map((section) => {
                    return (
                        <section key={section.id} className="space-y-2">
                            <div className="px-2">
                                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                                    {section.title}
                                </p>
                                {section.description ? (
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        {section.description}
                                    </p>
                                ) : null}
                            </div>

                            <ul className="space-y-1">
                                {section.items.map((item) =>
                                    renderMenuItem(item),
                                )}
                            </ul>

                            {section.footerAction?.href && (
                                <div className="pt-2">
                                    <a
                                        href={toUrl(section.footerAction.href)}
                                        className="inline-flex h-10 w-full items-center justify-center rounded-md border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-[#1a73e8] shadow-xs hover:bg-blue-50 dark:border-blue-900 dark:bg-[#202124] dark:text-[#8ab4f8] dark:hover:bg-blue-900/30"
                                        onClick={() => {
                                            closeSidebarAfterNavigation();
                                        }}
                                    >
                                        {section.footerAction.label}
                                    </a>
                                </div>
                            )}
                        </section>
                    );
                })}
            </div>

            {/* Sticky logout footer */}
            <div className="shrink-0 border-t border-gray-300 px-3 py-3 dark:border-gray-700">
                <button
                    type="button"
                    onClick={() => router.post('/logout')}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 dark:text-gray-300 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                >
                    <ArrowRightStartOnRectangleIcon className="h-5 w-5 shrink-0 opacity-70" aria-hidden="true" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}
