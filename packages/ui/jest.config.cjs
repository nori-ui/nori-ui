const base = require('../../jest.config.base.cjs');

/** @type {import('jest').Config} */
module.exports = {
    ...base,
    rootDir: '.',
    displayName: 'unbogify-ui',
    projects: [
        {
            ...base,
            displayName: 'unbogify-ui:node',
            testEnvironment: 'node',
            testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts', '<rootDir>/__tests__/**/*.test.ts'],
            transform: {
                '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/../../tooling/tsconfig.test.json' }],
            },
        },
        {
            ...base,
            displayName: 'unbogify-ui:jsdom',
            testEnvironment: 'jsdom',
            testMatch: ['<rootDir>/src/**/__tests__/**/*.test.tsx'],
            setupFilesAfterEnv: ['<rootDir>/jest.setup.ts', '<rootDir>/jest.rn-setup.ts'],
            moduleNameMapper: {
                '^react-native$': 'react-native-web',
                '^react-native/(.*)$': 'react-native-web/$1',
            },
            transform: {
                '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/../../tooling/tsconfig.test.json' }],
            },
        },
    ],
};
