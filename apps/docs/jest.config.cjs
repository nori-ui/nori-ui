const base = require('../../jest.config.base.cjs');

/** @type {import('jest').Config} */
module.exports = {
    ...base,
    rootDir: '.',
    displayName: '@nori-ui/docs',
    testEnvironment: 'node',
    // Tests live under __tests__ at the docs root. Co-locate near the
    // module they cover when it's a single-file helper; group under
    // __tests__ when they exercise multiple lib files together.
    testMatch: ['<rootDir>/__tests__/**/*.test.ts', '<rootDir>/__tests__/**/*.test.tsx'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
};
