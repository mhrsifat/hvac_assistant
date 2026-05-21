import { Link } from '@inertiajs/react';
import {
    GlobeIcon,
    KeyRound,
    Palette,
    User,
} from 'lucide-react';
import type { PropsWithChildren } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editPassword } from '@/routes/user-password';
import type { NavItem } from '@/types';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Profile',
        href: edit(),
        icon: User,
    },
    {
        title: 'Password',
        href: editPassword(),
        icon: KeyRound,
    },
    {
        title: 'Appearance',
        href: editAppearance(),
        icon: Palette,
    },
    {
        title: 'System Branding',
        href: '/settings/system',
        icon: GlobeIcon,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    if (typeof window === 'undefined') {
        return null;
    }

    return (
        <div className="max-w-6xl px-4space-y-8">
            <div className="pb-2 border-b border-zinc-100 dark:border-zinc-900">
                <Heading
                    title="Settings"
                    description="Manage your profile, security, and interface preferences."
                />
            </div>

            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                <aside className="w-full lg:w-64 shrink-0">
                    <nav
                        className="flex flex-row lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 no-scrollbar"
                        aria-label="Settings"
                    >
                        {sidebarNavItems.map((item, index) => {
                            const isActive = isCurrentOrParentUrl(item.href);
                            const Icon = item.icon;

                            return (
                                <Button
                                    key={`${toUrl(item.href)}-${index}`}
                                    size="sm"
                                    variant="ghost"
                                    asChild
                                    className={cn(
                                        'w-auto lg:w-full justify-start gap-3 px-4 h-10 font-medium text-muted-foreground rounded-lg transition-all duration-200 whitespace-nowrap',
                                        isActive && 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm dark:bg-zinc-900 dark:text-zinc-50'
                                    )}
                                >
                                    <Link href={item.href}>
                                        {Icon && (
                                            <Icon className={cn(
                                                "h-4 w-4 text-muted-foreground/70 transition-colors",
                                                isActive && "text-zinc-950 dark:text-zinc-50"
                                            )} />
                                        )}
                                        {item.title}
                                    </Link>
                                </Button>
                            );
                        })}
                    </nav>
                </aside>

                <Separator className="lg:hidden my-2" />

                <div className="flex-1 min-w-0">
                    <section className="space-y-6">
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}