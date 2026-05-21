export type ThemeColorName = 'blue' | 'green' | 'red' | 'default';

export const ADMIN_THEME_COLOR: ThemeColorName = 'default'; // change this to swap colors!

export const themeConfig = {
    default: {
        text: 'text-gray-700 dark:text-gray-300',
        bgHover: 'hover:bg-gray-200 dark:hover:bg-[#3c4043]',
        bgActive: 'bg-[#dbe7fb] dark:bg-[#3c4043]',
        border: 'border-gray-300 dark:border-[#3c4043]',
        ring: 'focus-within:ring-blue-500 dark:focus-within:ring-blue-400',
        indicator: 'before:bg-gray-700 dark:before:bg-gray-300',
        activeSidebarBg: 'bg-gray-200 dark:bg-[#3c4043]',
    },
    blue: {
        text: 'text-blue-600 dark:text-blue-400',
        bgHover: 'hover:bg-blue-50 dark:hover:bg-blue-900/30',
        bgActive: 'bg-blue-100 dark:bg-blue-900/40',
        border: 'border-blue-600 dark:border-blue-400',
        ring: 'focus-within:ring-blue-500 dark:focus-within:ring-blue-400',
        indicator: 'before:bg-blue-600 dark:before:bg-blue-400',
        activeSidebarBg: 'bg-blue-50 dark:bg-[#3c4043]',
    },
    green: {
        text: 'text-green-600 dark:text-green-400',
        bgHover: 'hover:bg-green-50 dark:hover:bg-green-900/30',
        bgActive: 'bg-green-100 dark:bg-green-900/40',
        border: 'border-green-600 dark:border-green-400',
        ring: 'focus-within:ring-green-500 dark:focus-within:ring-green-400',
        indicator: 'before:bg-green-600 dark:before:bg-green-400',
        activeSidebarBg: 'bg-green-50 dark:bg-[#3c4043]',
    },
    red: {
        text: 'text-red-600 dark:text-red-400',
        bgHover: 'hover:bg-red-50 dark:hover:bg-red-900/30',
        bgActive: 'bg-red-100 dark:bg-red-900/40',
        border: 'border-red-600 dark:border-red-400',
        ring: 'focus-within:ring-red-500 dark:focus-within:ring-red-400',
        indicator: 'before:bg-red-600 dark:before:bg-red-400',
        activeSidebarBg: 'bg-red-50 dark:bg-[#3c4043]',
    },
};

export const getThemeConfig = () => themeConfig[ADMIN_THEME_COLOR];
