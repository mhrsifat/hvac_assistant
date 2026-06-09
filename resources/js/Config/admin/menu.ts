import {
    BanknotesIcon,
    ChartBarIcon,
    ClockIcon,
    Cog6ToothIcon,
    CreditCardIcon,
    EnvelopeIcon,
    GlobeAltIcon,
    ReceiptRefundIcon,
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
import * as account from '@/routes/account';
import { edit as editProfile } from '@/routes/profile';
import staticPages from '@/routes/static-pages';

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
        id: 'overview',
        title: 'Overview',
        description: 'Platform insights and user administration',
        items: [
            {
                id: 'dashboard',
                title: 'Dashboard',
                href: dashboard(),
                icon: Cog6ToothIcon,
            },
            {
                id: 'users',
                title: 'User management',
                href: '/users',
                relatedRoutes: ['/users', '/users/[^/]+'],
                icon: UsersIcon,
                roles: ['super-admin', 'admin'],
            },
        ],
    },
    {
        id: 'hvac-assistant',
        title: 'Hvac Assistant',
        description: 'Manage brands, models, and chats',
        items: [
            {
                id: 'brands',
                title: 'Brands',
                href: '/brands',
                icon: WindowIcon,
            },
            {
                id: 'models',
                title: 'Models',
                href: '/hvac-models',
                icon: SquaresPlusIcon,
            },
            {
                id: 'chats',
                title: 'Chats',
                href: '/chats',
                icon: ClockIcon,
            },
        ],
    },
    {
        id: 'monetization',
        title: 'Monetization',
        description: 'Manage subscription plans and billing',
        items: [
            {
                id: 'analytics',
                title: 'Analytics',
                href: '/monetization/analytics',
                relatedRoutes: ['/monetization/analytics'],
                icon: ChartBarIcon,
            },
            {
                id: 'plans',
                title: 'Plans',
                href: '/plans',
                // Updated relatedRoutes to properly match dynamic slugs
                relatedRoutes: [
                    '/plans',
                    '/plans/create',
                    // Use wildcard regex pattern to match any slug
                    '/plans/[^/]+/edit',
                    '/plans/[^/]+',
                ],
                icon: BanknotesIcon,
            },
            {
                id: 'subscriptions',
                title: 'Subscriptions',
                href: '/subscriptions',
                relatedRoutes: ['/subscriptions', '/subscriptions/[^/]+'],
                icon: CreditCardIcon,
            },
            {
                id: 'transactions',
                title: 'Transactions',
                href: '/transactions',
                relatedRoutes: ['/transactions', '/transactions/[^/]+'],
                icon: ReceiptRefundIcon,
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
                href: staticPages.privacyPolicy.edit(),
                icon: FileText,
            },
            {
                id: 'terms-and-conditions',
                title: 'Terms and Conditions',
                href: staticPages.termsAndConditions.edit(),
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
                        href: account.edit(),
                        relatedRoutes: [
                            toUrl(editProfile()),
                            '/settings/password',
                            '/settings/appearance',
                            '/settings/account',
                            '',
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
                            {
                                id: 'integration-settings-google',
                                title: 'Google settings',
                                href: '/settings/integration/google',
                                permissions: ['manage settings'],
                                roles: ['super-admin', 'admin'],
                            },
                            {
                                id: 'integration-settings-apple',
                                title: 'Apple settings',
                                href: '/settings/integration/apple',
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
                id: 'development-tools',
                title: 'Development',
                href: null,
                icon: WrenchIcon,
                permissions: ['manage settings'],
                roles: ['super-admin', 'admin'],
                children: [
                    {
                        id: 'development-chat-broadcast-tester',
                        title: 'Chat broadcast tester',
                        href: '/settings/development/chat-broadcast-tester',
                        permissions: ['manage settings'],
                        roles: ['super-admin', 'admin'],
                    },
                    {
                        id: 'development-db-manager',
                        title: 'Database Manager',
                        href: '/settings/development/db-manager',
                        permissions: ['manage settings'],
                        roles: ['super-admin', 'admin'],
                    },
                ],
            },
        ],        
        footerAction: {
            label: 'View all Models',
            href: '/hvac-models',
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
