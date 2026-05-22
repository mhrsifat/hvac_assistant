import {
    AdjustmentsHorizontalIcon,
    ChartBarIcon,
    ClockIcon,
    CloudIcon,
    Cog6ToothIcon,
    EnvelopeIcon,
    GlobeAltIcon,
    HeartIcon,
    HomeIcon,
    LifebuoyIcon,
    ServerIcon,
    ShieldCheckIcon,
    SquaresPlusIcon,
    UserIcon,
    UsersIcon,
    WindowIcon,
    WrenchIcon,
} from '@heroicons/react/24/outline';
import type { InertiaLinkProps } from '@inertiajs/react';
import { FileText, Scale } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { toUrl } from '@/lib/utils';
import { dashboard } from '@/routes';
import { edit as editProfile } from '@/routes/profile';

type AdminMenuHref = NonNullable<InertiaLinkProps['href']>;

export type AdminMenuItem = {
    id: string;
    title: string;
    href?: AdminMenuHref | null;
    icon?: ComponentType<SVGProps<SVGSVGElement>>;
    permissions?: string[];
    roles?: string[];
    relatedRoutes?: string[];
    children?: AdminMenuItem[];
    helperLabel?: string;
};

export type AdminMenuItemColors = {
    defaultTextClass: string;
    hoverTextClass: string;
    activeTextClass: string;
    defaultBackgroundClass: string;
    hoverBackgroundClass: string;
    activeBackgroundClass: string;
};

export type AdminMenuSection = {
    id: string;
    title: string;
    description?: string;
    items: AdminMenuItem[];
    footerAction?: {
        label: string;
        href?: AdminMenuHref | null;
    };
};

type AccessContext = {
    userRoles: string[];
    userPermissions: string[];
};

export type AdminSearchItem = {
    id: string;
    title: string;
    href: AdminMenuHref;
    section: string;
};

export const adminMenuSections: AdminMenuSection[] = [
    {
        id: 'cloud-hub',
        title: 'Cloud hub',
        items: [
            {
                id: 'cloud-hub-root',
                title: 'Cloud Hub',
                href: dashboard(),
                icon: CloudIcon,
                children: [
                    {
                        id: 'cloud-hub-home',
                        title: 'Home',
                        href: dashboard(),
                        icon: HomeIcon,
                    },
                    {
                        id: 'cloud-hub-deployments',
                        title: 'Deployments',
                        href: dashboard(),
                        icon: ServerIcon,
                    },
                    {
                        id: 'cloud-hub-health',
                        title: 'Health & troubleshooting',
                        href: dashboard(),
                        icon: HeartIcon,
                    },
                    {
                        id: 'cloud-hub-security',
                        title: 'Security & compliance',
                        href: dashboard(),
                        icon: ShieldCheckIcon,
                    },
                    {
                        id: 'cloud-hub-optimization',
                        title: 'Optimization',
                        href: dashboard(),
                        icon: AdjustmentsHorizontalIcon,
                    },
                    {
                        id: 'cloud-hub-quotas',
                        title: 'Quotas & reservations',
                        href: dashboard(),
                        icon: ChartBarIcon,
                    },
                    {
                        id: 'cloud-hub-maintenance',
                        title: 'Maintenance',
                        href: dashboard(),
                        icon: WrenchIcon,
                    },
                    {
                        id: 'cloud-hub-support',
                        title: 'Support',
                        href: dashboard(),
                        icon: LifebuoyIcon,
                    },
                    {
                        id: 'cloud-hub-topology',
                        title: 'App Topology',
                        href: dashboard(),
                        icon: GlobeAltIcon,
                        helperLabel: 'Preview',
                    },
                ],
            },
            {
                id: 'cloud-overview',
                title: 'Cloud overview',
                href: dashboard(),
                icon: WindowIcon,
            },
            {
                id: 'solutions',
                title: 'Solutions',
                href: dashboard(),
                icon: SquaresPlusIcon,
            },
            {
                id: 'recently-visited',
                title: 'Recently visited',
                href: dashboard(),
                icon: ClockIcon,
            },
        ],
    },
    {
        id: 'administration',
        title: 'Administration',
        description: 'Manage settings, policies, and system configuration',
        items: [
            {
                id: 'privacy-policy',
                title: 'Privacy Policy',
                href: '/settings/privacy-policy',
                icon: FileText,
            },
            {
                id: 'terms-and-conditions',
                title: 'Terms and Conditions',
                href: '/settings/terms-and-conditions',
                icon: Scale,
            },
            {
                id: 'settings',
                title: 'Settings',
                href: null,
                icon: Cog6ToothIcon,
                permissions: ['manage settings'],
                roles: ['super-admin', 'admin'],
                children: [
                    {
                        id: 'account-settings',
                        title: 'Account settings',
                        href: '/settings/account',
                        relatedRoutes: [
                            toUrl(editProfile()),
                            '/settings/password',
                            '/settings/appearance',
                            '/settings/account',
                        ],
                        icon: UserIcon,
                        permissions: ['manage settings'],
                        roles: ['super-admin', 'admin'],
                        // children: [
                        //     {
                        //         id: 'account-settings-profile',
                        //         title: 'Profile',
                        //         href: editProfile(),
                        //         icon: UserIcon,
                        //         permissions: [],
                        //         roles: ['super-admin', 'admin'],
                        //     },
                        //     {
                        //         id: 'account-settings-password',
                        //         title: 'Password',
                        //         href: editPassword(),
                        //         icon: KeyIcon,
                        //         permissions: [],
                        //         roles: ['super-admin', 'admin'],
                        //     },
                        //     {
                        //         id: 'account-settings-appearance',
                        //         title: 'Appearance',
                        //         href: editAppearance(),
                        //         icon: Palette,
                        //         permissions: [],
                        //         roles: ['super-admin', 'admin'],
                        //     },
                        // ],
                    },
                    {
                        id: 'integration-settings',
                        title: 'Integration settings',
                        href: null,
                        icon: EnvelopeIcon,
                        permissions: ['manage settings'],
                        roles: ['super-admin', 'admin'],
                        children: [
                            {
                                id: 'integration-settings-smtp',
                                title: 'SMTP settings',
                                href: '/settings/integration/smtp',
                                permissions: ['manage settings'],
                                roles: ['super-admin', 'admin'],
                            },
                            {
                                id: 'integration-settings-ai',
                                title: 'AI settings',
                                href: '/settings/integration/ai',
                                permissions: ['manage settings'],
                                roles: ['super-admin', 'admin'],
                            },
                        ],
                    },
                    {
                        id: 'settings-system-branding',
                        title: 'System branding',
                        href: '/settings/system',
                        icon: GlobeAltIcon,
                        permissions: [],
                        roles: ['super-admin', 'admin'],
                    },
                ],
            },
            {
                id: 'users',
                title: 'User management',
                href: null,
                icon: UsersIcon,
                roles: ['super-admin', 'admin'],
            },
        ],
        footerAction: {
            label: 'View all Models',
            href: dashboard(),
        },
    },
];

const matchesAccessRules = (
    item: AdminMenuItem,
    { userRoles, userPermissions }: AccessContext,
): boolean => {
    const hasRoleRule = Boolean(item.roles?.length);
    const hasPermissionRule = Boolean(item.permissions?.length);

    if (!hasRoleRule && !hasPermissionRule) {
        return true;
    }

    const roleMatch = item.roles?.some((role) => userRoles.includes(role));
    const permissionMatch = item.permissions?.some((permission) =>
        userPermissions.includes(permission),
    );

    return Boolean(roleMatch || permissionMatch);
};

export const filterAdminMenuByAccess = (
    items: AdminMenuItem[],
    accessContext: AccessContext,
): AdminMenuItem[] => {
    return items.reduce<AdminMenuItem[]>((authorizedItems, item) => {
        const authorizedChildren = item.children
            ? filterAdminMenuByAccess(item.children, accessContext)
            : undefined;

        const canAccessItem = matchesAccessRules(item, accessContext);
        const hasAuthorizedChildren = Boolean(authorizedChildren?.length);

        if (!canAccessItem && !hasAuthorizedChildren) {
            return authorizedItems;
        }

        if (!item.href && !hasAuthorizedChildren) {
            return authorizedItems;
        }

        authorizedItems.push({
            ...item,
            children: hasAuthorizedChildren ? authorizedChildren : undefined,
        });

        return authorizedItems;
    }, []);
};

export const filterAdminMenuSectionsByAccess = (
    sections: AdminMenuSection[],
    accessContext: AccessContext,
): AdminMenuSection[] => {
    return sections
        .map((section) => {
            const authorizedItems = filterAdminMenuByAccess(
                section.items,
                accessContext,
            );

            if (!authorizedItems.length) {
                return null;
            }

            return {
                ...section,
                items: authorizedItems,
            };
        })
        .filter((section): section is AdminMenuSection => section !== null);
};

export const flattenAdminMenuForSearch = (
    items: AdminMenuItem[],
    parents: string[] = [],
): AdminSearchItem[] => {
    return items.flatMap((item) => {
        const section = [...parents, item.title].join(' / ');
        const currentItem: AdminSearchItem[] = item.href
            ? [
                  {
                      id: item.id,
                      title: item.title,
                      href: item.href,
                      section,
                  },
              ]
            : [];

        const childItems = item.children
            ? flattenAdminMenuForSearch(item.children, [...parents, item.title])
            : [];

        return [...currentItem, ...childItems];
    });
};

export const flattenAdminMenuSectionsForSearch = (
    sections: AdminMenuSection[],
): AdminSearchItem[] => {
    return sections.flatMap((section) =>
        flattenAdminMenuForSearch(section.items, [section.title]),
    );
};

export const adminMenu = adminMenuSections.flatMap((section) => section.items);
