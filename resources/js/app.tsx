import { createInertiaApp } from '@inertiajs/react';
import { configureEcho } from '@laravel/echo-react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import { initializeTheme } from '@/hooks/use-appearance';

configureEcho({
    broadcaster: 'reverb',
});

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';
const appPages = import.meta.glob('./pages/**/*.tsx');
const modulePages = Object.fromEntries(
    Object.entries(
        import.meta.glob('../../Modules/*/resources/js/Pages/**/*.tsx'),
    ).map(([path, loader]) => [
        path.replace(
            /^\.\.\/\.\.\/Modules\/[^/]+\/resources\/js\/Pages\//,
            './pages/',
        ),
        loader,
    ]),
);

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            Object.assign({}, appPages, modulePages),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <StrictMode>
                <App {...props} />
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
