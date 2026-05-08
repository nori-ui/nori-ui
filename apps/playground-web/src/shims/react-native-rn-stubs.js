// Web stubs for the bits of react-native that react-native-web doesn't ship.
// Reanimated and other native-leaning libraries pull these from
// `react-native` directly; on web there's nothing real to expose, so we
// hand them harmless no-ops. The vite alias re-exports react-native-web
// for everything else, then layers these on top.
import * as ReactNativeWeb from 'react-native-web';

export * from 'react-native-web';
export default ReactNativeWeb.default;

// TurboModuleRegistry — RN's native-module lookup. On web every module
// resolves to null (no native side), and consumers gate on the result.
export const TurboModuleRegistry = {
    get: () => null,
    getEnforcing: (_name) => {
        // Return a Proxy so callers that touch arbitrary methods don't
        // crash mid-render. The methods themselves return undefined.
        return new Proxy({}, { get: () => () => undefined });
    },
};
