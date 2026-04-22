// RN-Web rendering shims. Keeps the jsdom project stable for both plain
// DOM tests (Slot, Icon wrapper) and RN-primitive tests (Text, Box, HStack, VStack).
//
// The key insight: react-native-web outputs real DOM nodes for <View> and <Text>,
// which RTL queries via role/text selectors. No bridge, no simulator.

// Silence RN's "useNativeDriver" warnings in jsdom — they're harmless for layout tests.
// biome-ignore lint/suspicious/noConsole: intentional console override to silence RN warnings in tests
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
    const first = typeof args[0] === 'string' ? args[0] : '';
    if (first.includes('useNativeDriver')) return;
    originalWarn(...args);
};
