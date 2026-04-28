const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// expo-router + the CSF loader (`packages/core/src/stories/csf-loader.tsx`)
// rely on Metro's `require.context` to enumerate routes and stories at
// bundle time. Metro 0.72+ supports this only when explicitly opted in.
config.transformer = {
    ...config.transformer,
    unstable_allowRequireContext: true,
};

// Watch the full monorepo so workspace packages update on change.
config.watchFolders = [workspaceRoot];

// Look up modules from both the app's node_modules and the workspace root's.
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
];

// Allow symlinked workspace packages.
config.resolver.disableHierarchicalLookup = false;

// Honor `package.json#exports`. Without this, Metro silently falls back
// to file-based resolution for subpath exports like `@nori-ui/core/client`,
// which then resolves to the SOURCE tree instead of `dist/`. The result:
// NoriProvider (loaded via `/client`) and the library Text (loaded via
// `@nori-ui/core`) end up in TWO different module instances, each with
// their own `ColorSchemeOverrideContext` — the provider mounts one and
// the consumer reads the other, so `colorScheme="dark"` never propagates
// and Text always reads `theme.light`. Enabling `unstable_enablePackageExports`
// forces Metro to honor the exports map and resolve both to `dist/`.
config.resolver.unstable_enablePackageExports = true;

module.exports = withNativeWind(config, { input: './global.css' });
