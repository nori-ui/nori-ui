const base = require('../../jest.config.base.cjs');

/** @type {import('jest').Config} */
module.exports = {
    ...base,
    rootDir: '.',
    displayName: 'nori-ui',
    projects: [
        {
            ...base,
            displayName: 'nori-ui:node',
            testEnvironment: 'node',
            testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts', '<rootDir>/__tests__/**/*.test.ts'],
            transform: {
                '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/../../tooling/tsconfig.test.json' }],
            },
        },
        {
            ...base,
            displayName: 'nori-ui:jsdom',
            testEnvironment: 'jsdom',
            testMatch: ['<rootDir>/src/**/__tests__/**/*.test.tsx'],
            setupFilesAfterEnv: ['<rootDir>/jest.setup.ts', '<rootDir>/jest.rn-setup.ts'],
            transform: {
                '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/../../tooling/tsconfig.test.json' }],
            },
        },
    ],
};
