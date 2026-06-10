import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { globalSearchSections } from '@/Config/admin/search-items';
import type { GlobalSearchItem } from '@/Config/admin/search-items';
import { getThemeConfig } from '@/Config/theme';
import { cn } from '@/lib/utils';

const isTypingElement = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    return (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
    );
};

type GlobalSearchPageProps = {
    auth?: {
        roles?: string[];
        permissions?: string[];
    };
};

export default function GlobalSearch() {

    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const theme = getThemeConfig();

    const { props: { auth } } = usePage<GlobalSearchPageProps>();

    const allowedSections = useMemo(() => {
        const userRoles = auth?.roles ?? [];
        const userPermissions = auth?.permissions ?? [];

        return globalSearchSections.map(section => {
            const allowedItems = section.items.filter(item => {
                // If item has no roles/permissions defined, it's allowed for all authenticated users
                if (!item.roles?.length && !item.permissions?.length) {
                    return true;
                }

                // Check roles
                if (item.roles?.length) {
                    const hasRole = item.roles.some(role => userRoles.includes(role));

                    if (hasRole) {
                        return true;
                    }
                }

                // Check permissions
                if (item.permissions?.length) {
                    const hasPermission = item.permissions.some(permission => userPermissions.includes(permission));

                    if (hasPermission) {
                        return true;
                    }
                }

                return false;
            });

            return { ...section, items: allowedItems };
        }).filter(section => section.items.length > 0);
    }, [auth?.roles, auth?.permissions]);

    // 2. Filter based on Search Query
    const filteredSections = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        // If query is empty, show all allowed sections
        if (!normalizedQuery) {
            return allowedSections;
        }

        return allowedSections.map(section => {
            const matchedItems = section.items.filter(item => {
                const matchesTitle = item.title.toLowerCase().includes(normalizedQuery);
                const matchesSection = section.title.toLowerCase().includes(normalizedQuery);
                const matchesDesc = item.description ? item.description.toLowerCase().includes(normalizedQuery) : false;

                return matchesTitle || matchesSection || matchesDesc;
            });

            return { ...section, items: matchedItems };
        }).filter(section => section.items.length > 0);
    }, [allowedSections, query]);

    // Flatten items to easily manage keyboard navigation
    const flatFilteredItems = useMemo(() => {
        return filteredSections.flatMap(section => 
            section.items.map(item => ({ ...item, sectionTitle: section.title }))
        );
    }, [filteredSections]);

    const goToResult = (item: GlobalSearchItem): void => {
        router.visit(item.href as string);
        setIsOpen(false);
        setQuery('');
    };

    // Scroll active item into view
    useEffect(() => {
        if (isOpen && listRef.current) {
            const activeElement = listRef.current.querySelector('.active-search-item');

            if (activeElement) {
                activeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }, [activeIndex, isOpen]);

    const handleInputKeyDown = (
        event: ReactKeyboardEvent<HTMLInputElement>,
    ): void => {
        if (!flatFilteredItems.length) {
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((prev) => (prev + 1) % flatFilteredItems.length);
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((prev) => (prev <= 0 ? flatFilteredItems.length - 1 : prev - 1));
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            goToResult(flatFilteredItems[activeIndex] ?? flatFilteredItems[0]);
        }

        if (event.key === 'Escape') {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        const handlePointerDown = (event: PointerEvent): void => {
            const target = event.target;

            if (!(target instanceof Node)) {
return;
}

            if (!containerRef.current?.contains(target)) {
setIsOpen(false);
}
        };

        const handleShortcut = (event: KeyboardEvent): void => {
            const pressedSlash = event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey;
            const pressedCommandPalette = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';

            if (!pressedSlash && !pressedCommandPalette) {
return;
}

            if (pressedSlash && isTypingElement(event.target)) {
return;
}

            event.preventDefault();
            inputRef.current?.focus();
            setActiveIndex(0);
            setIsOpen(true);
        };

        window.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('keydown', handleShortcut);

        return () => {
            window.removeEventListener('pointerdown', handlePointerDown);
            window.removeEventListener('keydown', handleShortcut);
        };
    }, []);

    let globalItemIndex = -1; // To track flat index while rendering grouped sections

    return (
        <div ref={containerRef} className="relative w-full">
            <label htmlFor="global-search" className="sr-only">
                Global search
            </label>

            <div
                className={cn(
                    'flex h-11 items-center rounded-md border border-gray-300 bg-white shadow-sm transition focus-within:border-blue-500 focus-within:ring-2 dark:border-[#3c4043] dark:bg-[#202124] dark:focus-within:border-transparent',
                    theme.ring,
                )}
            >
                <MagnifyingGlassIcon
                    className="ml-3 h-5 w-5 shrink-0 text-gray-400"
                    aria-hidden="true"
                />
                <input
                    ref={inputRef}
                    id="global-search"
                    value={query}
                    onFocus={() => {
                        setActiveIndex(0);
                        setIsOpen(true);
                    }}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setActiveIndex(0);
                        setIsOpen(true);
                    }}
                    onKeyDown={handleInputKeyDown}
                    placeholder="Search resources, docs, products, and more"
                    className="h-full w-full border-none bg-transparent px-2 text-sm text-gray-700 outline-none placeholder:text-gray-400 dark:text-gray-200"
                />

                {/* <button
                    type="button"
                    onClick={() => {
                        if (!flatFilteredItems.length) return;
                        goToResult(flatFilteredItems[0]);
                    }}
                    className={cn(
                        'mr-1 flex h-9 items-center rounded-md border border-transparent px-3 text-sm font-medium transition',
                        theme.text,
                        theme.bgHover,
                    )}
                >
                    Search
                </button> */}
            </div>

            {isOpen && (
                <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-[#303134] dark:bg-[#202124]">
                    {filteredSections.length > 0 ? (
                        <ul ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
                            {filteredSections.map((section, sectionIndex) => (
                                <div key={section.title}>
                                    {/* Section Header */}
                                    <div className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 sticky top-0 bg-white/95 dark:bg-[#202124]/95 backdrop-blur z-10">
                                        {section.title}
                                    </div>
                                    
                                    {/* Section Items */}
                                    {section.items.map((item) => {
                                        globalItemIndex++;
                                        const isCurrentActive = globalItemIndex === activeIndex;

                                        return (
                                            <li
                                                key={item.id}
                                                className={cn(
                                                    'cursor-pointer px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-[#3c4043]',
                                                    isCurrentActive ? 'bg-gray-100 dark:bg-[#3c4043] active-search-item' : ''
                                                )}
                                                onClick={() => goToResult(item)}
                                            >
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {item.title}
                                                </div>
                                                {item.description && (
                                                    <div className="text-xs mt-0.5 text-gray-500 dark:text-gray-400 line-clamp-1">
                                                        {item.description}
                                                    </div>
                                                )}
                                            </li>
                                        );
                                    })}
                                    
                                    {/* Separator between sections */}
                                    {sectionIndex !== filteredSections.length - 1 && (
                                        <div className="my-1 border-b border-gray-100 dark:border-[#303134]" />
                                    )}
                                </div>
                            ))}
                        </ul>
                    ) : (
                        <div className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                            No results found. {(auth?.roles?.length ?? 0) === 0 && ' (You might not have admin permissions)'}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}