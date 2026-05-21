import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
    build: {
        outDir: '../../public/build-settings',
        emptyOutDir: true,
        manifest: true,
    },

    plugins: [
        laravel({
            publicDirectory: '../../public',
            buildDirectory: 'build-settings',
            input: [
                resolve(__dirname, 'resources/assets/sass/app.scss'),
                resolve(__dirname, 'resources/assets/js/app.js'),
            ],
            refresh: true,
        }),
    ],

    resolve: {
        alias: {
            '@': resolve(__dirname, 'resources/js'),
        },
    },
});
