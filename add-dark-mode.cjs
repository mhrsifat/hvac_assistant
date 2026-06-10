/* global __dirname, require */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const replacements = [
    { pattern: /(?<!dark:)bg-white/g, replacement: 'bg-white dark:bg-slate-900' },
    { pattern: /(?<!dark:)bg-slate-50\b/g, replacement: 'bg-slate-50 dark:bg-slate-800/50' },
    { pattern: /(?<!dark:)bg-slate-100\b/g, replacement: 'bg-slate-100 dark:bg-slate-800' },
    { pattern: /(?<!dark:)text-slate-900\b/g, replacement: 'text-slate-900 dark:text-white' },
    { pattern: /(?<!dark:)text-slate-700\b/g, replacement: 'text-slate-700 dark:text-slate-300' },
    { pattern: /(?<!dark:)text-slate-600\b/g, replacement: 'text-slate-600 dark:text-slate-300' },
    { pattern: /(?<!dark:)text-slate-500\b/g, replacement: 'text-slate-500 dark:text-slate-400' },
    { pattern: /(?<!dark:)border-slate-200\b/g, replacement: 'border-slate-200 dark:border-slate-800' },
    { pattern: /(?<!dark:)border-slate-100\b/g, replacement: 'border-slate-100 dark:border-slate-800' },
    { pattern: /(?<!dark:)ring-slate-200\b/g, replacement: 'ring-slate-200 dark:ring-slate-800' },
    { pattern: /(?<!dark:)hover:bg-slate-50\b/g, replacement: 'hover:bg-slate-50 dark:hover:bg-slate-800/25' },
    { pattern: /(?<!dark:)hover:bg-slate-100\b/g, replacement: 'hover:bg-slate-100 dark:hover:bg-slate-800/50' },
    { pattern: /(?<!dark:)bg-emerald-50\b/g, replacement: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { pattern: /(?<!dark:)text-emerald-700\b/g, replacement: 'text-emerald-700 dark:text-emerald-400' },
    { pattern: /(?<!dark:)border-emerald-200\b/g, replacement: 'border-emerald-200 dark:border-emerald-500/20' },
    { pattern: /(?<!dark:)bg-red-50\b/g, replacement: 'bg-red-50 dark:bg-red-500/10' },
    { pattern: /(?<!dark:)text-red-700\b/g, replacement: 'text-red-700 dark:text-red-400' },
    { pattern: /(?<!dark:)border-red-200\b/g, replacement: 'border-red-200 dark:border-red-500/20' },
    { pattern: /(?<!dark:)bg-amber-50\b/g, replacement: 'bg-amber-50 dark:bg-amber-500/10' },
    { pattern: /(?<!dark:)text-amber-700\b/g, replacement: 'text-amber-700 dark:text-amber-400' },
    { pattern: /(?<!dark:)border-amber-200\b/g, replacement: 'border-amber-200 dark:border-amber-500/20' },
    { pattern: /(?<!dark:)bg-sky-50\b/g, replacement: 'bg-sky-50 dark:bg-sky-500/10' },
    { pattern: /(?<!dark:)text-sky-700\b/g, replacement: 'text-sky-700 dark:text-sky-400' },
    { pattern: /(?<!dark:)border-sky-200\b/g, replacement: 'border-sky-200 dark:border-sky-500/20' },
    { pattern: /(?<!dark:)bg-indigo-50\b/g, replacement: 'bg-indigo-50 dark:bg-indigo-500/10' },
    { pattern: /(?<!dark:)text-indigo-700\b/g, replacement: 'text-indigo-700 dark:text-indigo-400' },
    { pattern: /(?<!dark:)border-indigo-200\b/g, replacement: 'border-indigo-200 dark:border-indigo-500/20' },
    { pattern: /(?<!dark:)bg-violet-50\b/g, replacement: 'bg-violet-50 dark:bg-violet-500/10' },
    { pattern: /(?<!dark:)text-violet-700\b/g, replacement: 'text-violet-700 dark:text-violet-400' },
    { pattern: /(?<!dark:)border-violet-200\b/g, replacement: 'border-violet-200 dark:border-violet-500/20' },
    { pattern: /bg-slate-800\/50\/50/g, replacement: 'bg-slate-800/50' },
    { pattern: /(?<!dark:)bg-cyan-50\b/g, replacement: 'bg-cyan-50 dark:bg-cyan-500/10' },
    { pattern: /(?<!dark:)bg-blue-50\b/g, replacement: 'bg-blue-50 dark:bg-blue-500/10' },
    { pattern: /(?<!dark:)text-blue-700\b/g, replacement: 'text-blue-700 dark:text-blue-400' },
    { pattern: /(?<!dark:)border-blue-200\b/g, replacement: 'border-blue-200 dark:border-blue-500/20' },
    { pattern: /(?<!dark:)bg-rose-50\b/g, replacement: 'bg-rose-50 dark:bg-rose-500/10' },
    { pattern: /(?<!dark:)text-rose-900\b/g, replacement: 'text-rose-900 dark:text-rose-400' },
    { pattern: /(?<!dark:)border-rose-200\b/g, replacement: 'border-rose-200 dark:border-rose-500/20' },
    { pattern: /(?<!dark:)bg-indigo-100\b/g, replacement: 'bg-indigo-100 dark:bg-indigo-900/50' },
    { pattern: /(?<!dark:)divide-slate-100\b/g, replacement: 'divide-slate-100 dark:divide-slate-800' }
];

function processDirectory(dir) {
    if (!fs.existsSync(dir)) {
return;
}
    
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);

        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;
            
            replacements.forEach(({ pattern, replacement }) => {
                content = content.replace(pattern, replacement);
            });
            
            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    });
}

const targets = [
    path.join(__dirname, 'Modules', 'Monetization', 'resources', 'js', 'Pages')
];

targets.forEach(t => processDirectory(t));
