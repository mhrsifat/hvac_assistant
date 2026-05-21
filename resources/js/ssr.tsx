import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import ReactDOMServer from 'react-dom/server';

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

createServer((page) =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        title: (title) => (title ? `${title} - ${appName}` : appName),
        resolve: (name) =>
            resolvePageComponent(
                `./pages/${name}.tsx`,
                Object.assign({}, appPages, modulePages),
            ),
        setup: ({ App, props }) => {
            return <App {...props} />;
        },
    }),
);
