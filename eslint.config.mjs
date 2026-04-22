// eslint.config.mjs — this config runs ALONGSIDE Biome.
// Biome owns: formatting, JS/TS correctness, a11y, react-hooks, style.
// ESLint owns: ONLY eslint-plugin-react-native rules, because Biome has no RN-specific plugin today.
// When Biome ships RN rules, DELETE this file and remove eslint deps.

import reactNative from 'eslint-plugin-react-native';
import globals from 'globals';

export default [
    {
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/.next/**',
            '**/.expo/**',
            '**/coverage/**',
            '**/.yarn/**',
        ],
    },
    {
        files: ['**/*.{ts,tsx,js,jsx}'],
        plugins: {
            'react-native': reactNative,
        },
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                ...reactNative.environments['react-native'].globals,
            },
        },
        rules: {
            // RN-specific lints that Biome does not cover yet:
            'react-native/no-unused-styles': 'error',
            'react-native/split-platform-components': 'off', // we target both platforms universally
            'react-native/no-inline-styles': 'warn',
            'react-native/no-color-literals': 'warn',
            'react-native/no-raw-text': 'off', // false positives inside Text component internals
            'react-native/no-single-element-style-arrays': 'error',
        },
    },
];
