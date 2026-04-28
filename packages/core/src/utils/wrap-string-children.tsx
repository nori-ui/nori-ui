import { Children, type ReactNode } from 'react';
import { Text } from '../components/Text';

/**
 * Walks a `ReactNode` (single, array, or fragment) and wraps every
 * string/number child in a themed `<Text>` so the same JSX renders
 * cleanly on web AND native. Non-string children are passed through
 * unchanged.
 *
 * On native, raw strings as children of any non-Text component throw
 * "Text strings must be rendered within a <Text> component". On web,
 * react-native-web silently tolerates them — but the rendered string
 * inherits no theme color, so dark mode never flips.
 *
 * Both bugs collapse to the same fix: wrap. Layout primitives
 * (`<HStack>`, `<VStack>`, `<Box>`) use this so consumers can write
 * `<HStack>Hello</HStack>` and have it Just Work on both platforms
 * and across light/dark mode.
 *
 * The wrapper is the lib's own `<Text>`, which reads from
 * `useThemeColors()` — so the wrapped string flips with the active
 * scheme. Importing a `'use client'` component from an RSC-safe file
 * is allowed; React's RSC model lets server components contain client
 * children.
 */
export function wrapStringChildren(children: ReactNode): ReactNode {
    return Children.map(children, (child) => {
        if (typeof child === 'string' || typeof child === 'number') {
            return <Text>{child}</Text>;
        }
        return child;
    });
}
