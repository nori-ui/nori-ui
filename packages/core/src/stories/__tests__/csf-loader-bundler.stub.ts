// Jest stub for ../csf-loader-bundler.
// The real module uses `import.meta` and `require.context`, both of which
// are bundler-specific (Vite / Metro). Under ts-jest's CJS target neither
// is parseable, so tests substitute this empty stub via moduleNameMapper.
// Test suites inject CSF fixtures via `__setCsfModules` instead.

export function discoverCsfModules(): Record<string, never> {
    return {};
}
