import type { InertiaLinkProps } from '@inertiajs/react';

export type GlobalSearchItem = {
    id: string;
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    description?: string;
    roles?: string[];
    permissions?: string[];
};

export type GlobalSearchSection = {
    title: string;
    items: GlobalSearchItem[];
};

export const globalSearchSections: GlobalSearchSection[] = [
    {
        title: 'Overview',
        items: [
            {
                id: 'dashboard',
                title: 'Dashboard',
                href: '/dashboard',
                description: 'Platform insights and user administration',
            },
            {
                id: 'users',
                title: 'User management',
                href: '/users',
                description: 'Manage users, roles, and system access',
                roles: ['super-admin', 'admin'],
            },
        ],
    },
    {
        title: 'Hvac Assistant',
        items: [
            {
                id: 'brands',
                title: 'Brands',
                href: '/brands',
                description: 'Manage HVAC brands and logos',
            },
            {
                id: 'models',
                title: 'Models',
                href: '/hvac-models',
                description: 'Manage HVAC models, manuals, and error codes',
            },
            {
                id: 'chats',
                title: 'Chats',
                href: '/chats',
                description: 'View and manage support chat sessions',
            },
        ],
    },
    {
        title: 'Monetization',
        items: [
            {
                id: 'analytics',
                title: 'Analytics',
                href: '/monetization/analytics',
                description: 'View revenue and subscription analytics',
            },
            {
                id: 'plans',
                title: 'Plans',
                href: '/plans',
                description: 'Manage subscription plans and pricing',
            },
            {
                id: 'subscriptions',
                title: 'Subscriptions',
                href: '/subscriptions',
                description: 'Manage user active subscriptions',
            },
            {
                id: 'transactions',
                title: 'Transactions',
                href: '/transactions',
                description: 'View billing history and successful transactions',
            },
        ],
    },
    {
        title: 'Administration',
        items: [
            {
                id: 'privacy-policy',
                title: 'Privacy Policy',
                href: '/admin/static-pages/privacy-policy/edit',
                description: 'Edit platform privacy policy text',
            },
            {
                id: 'terms-and-conditions',
                title: 'Terms and Conditions',
                href: '/admin/static-pages/terms-and-conditions/edit',
                description: 'Edit platform terms and conditions text',
            },
        ],
    },
    {
        title: 'Administration / Settings / Account',
        items: [
            {
                id: 'account-settings',
                title: 'Account settings',
                href: '/settings/account',
                description: 'Manage your primary account details',
                permissions: ['manage settings'],
                roles: ['super-admin', 'admin'],
            },
            {
                id: 'account-settings-profile',
                title: 'Profile settings',
                href: '/settings/profile',
                description: 'Update your personal profile information',
                permissions: ['manage settings'],
                roles: ['super-admin', 'admin'],
            },
            {
                id: 'account-settings-password',
                title: 'Password settings',
                href: '/settings/password',
                description: 'Change your account security password',
                permissions: ['manage settings'],
                roles: ['super-admin', 'admin'],
            },
            {
                id: 'account-settings-appearance',
                title: 'Appearance settings',
                href: '/settings/appearance',
                description: 'Manage platform UI theme (Dark/Light mode)',
                permissions: ['manage settings'],
                roles: ['super-admin', 'admin'],
            },
        ],
    },
    {
        title: 'Administration / Settings / Integrations',
        items: [
            {
                id: 'integration-settings-smtp',
                title: 'SMTP settings',
                href: '/settings/integration/smtp',
                description: 'Configure email delivery credentials',
                permissions: ['manage settings'],
                roles: ['super-admin', 'admin'],
            },
            {
                id: 'integration-settings-ai',
                title: 'AI settings',
                href: '/settings/integration/ai',
                description: 'Configure AI models and API credentials',
                permissions: ['manage settings'],
                roles: ['super-admin', 'admin'],
            },
            {
                id: 'integration-settings-google',
                title: 'Google settings',
                href: '/settings/integration/google',
                description: 'Configure Google OAuth and API services',
                permissions: ['manage settings'],
                roles: ['super-admin', 'admin'],
            },
            {
                id: 'integration-settings-apple',
                title: 'Apple settings',
                href: '/settings/integration/apple',
                description: 'Configure Apple login and integrations',
                permissions: ['manage settings'],
                roles: ['super-admin', 'admin'],
            },
        ],
    },
    {
        title: 'Administration / Settings / System',
        items: [
            {
                id: 'settings-system-branding',
                title: 'System branding',
                href: '/settings/system',
                description: 'Update application name, logo, and generic branding',
                permissions: ['manage settings'],
                roles: ['super-admin', 'admin'],
            },
        ],
    },
    {
        title: 'Administration / Development',
        items: [
            {
                id: 'development-chat-broadcast-tester',
                title: 'Chat broadcast tester',
                href: '/settings/development/chat-broadcast-tester',
                description: 'Test WebSocket connections and real-time events',
                permissions: ['manage settings'],
                roles: ['super-admin', 'admin'],
            },
            {
                id: 'development-db-manager',
                title: 'Database Manager',
                href: '/settings/development/db-manager',
                description: 'Manage tables and raw database configurations',
                permissions: ['manage settings'],
                roles: ['super-admin', 'admin'],
            },
        ],
    },
];

export const globalSearchItems: (GlobalSearchItem & { section: string })[] = 
    globalSearchSections.flatMap(section => 
        section.items.map(item => ({ ...item, section: section.title }))
    );