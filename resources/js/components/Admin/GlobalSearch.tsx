import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import type { InertiaLinkProps } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { getThemeConfig } from '@/Config/theme';
import { toUrl, cn } from '@/lib/utils';

type GlobalSearchItem = {
    id: string;
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    section: string;
};

type GlobalSearchProps = {
    items: GlobalSearchItem[];
};

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

export default function GlobalSearch({ items }: GlobalSearchProps) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const theme = getThemeConfig();

    const filteredItems = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        if (!normalizedQuery) {
            return items.slice(0, 8);
        }

        return items
            .filter((item) => {
                return (
                    item.title.toLowerCase().includes(normalizedQuery) ||
                    item.section.toLowerCase().includes(normalizedQuery)
                );
            })
            .slice(0, 8);
    }, [items, query]);

    const goToResult = (item: GlobalSearchItem): void => {
        router.visit(toUrl(item.href));
        setIsOpen(false);
        setQuery('');
    };

    const handleInputKeyDown = (
        event: ReactKeyboardEvent<HTMLInputElement>,
    ): void => {
        if (!filteredItems.length) {
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((previousIndex) => {
                return (previousIndex + 1) % filteredItems.length;
            });
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((previousIndex) => {
                return previousIndex <= 0
                    ? filteredItems.length - 1
                    : previousIndex - 1;
            });
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            goToResult(filteredItems[activeIndex] ?? filteredItems[0]);
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
            const pressedSlash =
                event.key === '/' &&
                !event.ctrlKey &&
                !event.metaKey &&
                !event.altKey;
            const pressedCommandPalette =
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === 'k';

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

                <button
                    type="button"
                    onClick={() => {
                        if (!filteredItems.length) {
                            return;
                        }

                        goToResult(filteredItems[0]);
                    }}
                    className={cn(
                        'mr-1 flex h-9 items-center rounded-md border border-transparent px-3 text-sm font-medium transition',
                        theme.text,
                        theme.bgHover,
                    )}
                >
                    Search
                </button>

                {/* <kbd className="mr-2 hidden rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#303134] px-2 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400 lg:inline-block">
          Ctrl K
        </kbd> */}
            </div>

            {isOpen && (
                <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-40 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-[#303134] dark:bg-[#202124]">
                    {filteredItems.length > 0 ? (
                        <ul className="max-h-96 overflow-y-auto py-1">
                            {filteredItems.map((item, index) => (
                                <li key={item.id}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            goToResult(item);
                                        }}
                                        className={cn(
                                            'w-full px-3 py-2 text-left transition',
                                            index === activeIndex
                                                ? cn(theme.bgActive, theme.text)
                                                : 'text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800',
                                        )}
                                    >
                                        <p className="text-sm font-medium">
                                            {item.title}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {item.section}
                                        </p>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                            No results found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
