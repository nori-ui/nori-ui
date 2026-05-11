const base = require('../../jest.config.base.cjs');

/** @type {import('jest').Config} */
module.exports = {
    ...base,
    rootDir: '.',
    displayName: '@nori-ui/core',
    projects: [
        {
            ...base,
            displayName: 'nori-ui:node',
            testEnvironment: 'node',
            testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts', '<rootDir>/__tests__/**/*.test.ts'],
            transform: {
                '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/../../tooling/tsconfig.test.json' }],
            },
            moduleNameMapper: {
                // The real bundler module uses `import.meta` (Vite) and `require.context`
                // (Metro), both unparseable under ts-jest's CJS target. Tests inject CSF
                // fixtures via `__setCsfModules` instead, so the stub returns an empty map.
                '^(.*)/csf-loader-bundler$': '<rootDir>/src/stories/__tests__/csf-loader-bundler.stub.ts',
            },
        },
        {
            ...base,
            displayName: 'nori-ui:jsdom',
            testEnvironment: 'jsdom',
            testMatch: ['<rootDir>/src/**/__tests__/**/*.test.tsx'],
            testPathIgnorePatterns: ['/node_modules/', '/__tests__/native/'],
            setupFilesAfterEnv: ['<rootDir>/jest.setup.ts', '<rootDir>/jest.rn-setup.ts'],
            // Honor `*.web.tsx` platform extensions in the jsdom project so
            // `import './ScrollBody'` resolves to `ScrollBody.web.tsx` first.
            moduleFileExtensions: ['web.tsx', 'web.ts', 'tsx', 'ts', 'jsx', 'js', 'json'],
            transform: {
                '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/../../tooling/tsconfig.test.json' }],
            },
            moduleNameMapper: {
                // The real bundler module uses `import.meta` (Vite) and `require.context`
                // (Metro), both unparseable under ts-jest's CJS target. Tests inject CSF
                // fixtures via `__setCsfModules` instead, so the stub returns an empty map.
                '^(.*)/csf-loader-bundler$': '<rootDir>/src/stories/__tests__/csf-loader-bundler.stub.ts',
            },
        },
        {
            ...base,
            displayName: 'nori-ui:rn',
            preset: 'jest-expo',
            testMatch: ['<rootDir>/src/**/__tests__/native/**/*.test.tsx'],
            setupFilesAfterEnv: ['<rootDir>/jest.native-setup.ts'],
            transform: {
                '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/../../tooling/tsconfig.test.json' }],
            },
        },
    ],
};
