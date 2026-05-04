import '@testing-library/jest-dom';

// react-native-safe-area-context: in jsdom there's no provider tree, so we
// stub the hook to a flat zero-inset record. Components that read insets
// (FloatButton, Toast bridge) get no padding contribution under test —
// which matches the web runtime behavior with no provider mounted.
jest.mock('react-native-safe-area-context', () => {
    const React = require('react');
    return {
        useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
        SafeAreaInsetsContext: React.createContext(null),
        // biome-ignore lint/suspicious/noExplicitAny: test stub
        SafeAreaProvider: ({ children }: { children: any }) => children,
    };
});
