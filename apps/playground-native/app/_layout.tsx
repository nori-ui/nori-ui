// Stack root for the playground showcase. Mounts NoriProvider once so
// every route inherits theming + i18n. Routes are file-based:
// `app/index.tsx` (home) and `app/components/[slug].tsx` (detail).
// The plural path matches the public web URL form (`/components/<slug>`)
// so deep links and Universal Links share one canonical shape.
//
// `colorScheme` flows from the app-level `<PlaygroundColorSchemeProvider>`
// so the floating toggle (rendered as a sibling of the stack) can flip
// the scheme for every screen.

import { NoriProvider } from '@nori-ui/core/client';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { ColorSchemeToggle, PlaygroundColorSchemeProvider, usePlaygroundColorScheme } from '../components/color-scheme';

export const unstable_settings = {
    initialRouteName: 'index',
};

export default function RootLayout() {
    return (
        <PlaygroundColorSchemeProvider>
            <ThemedShell />
        </PlaygroundColorSchemeProvider>
    );
}

function ThemedShell() {
    const { mode, effective } = usePlaygroundColorScheme();

    // When the user picked 'auto' we deliberately omit the prop so
    // NoriProvider falls back to its OS-following default. Forcing
    // either 'light' or 'dark' pins the library half regardless of
    // the device's Appearance.
    const noriProps = mode === 'auto' ? {} : { colorScheme: effective };
    // StatusBar tracks the EFFECTIVE scheme — light bar glyphs on dark
    // surface, dark glyphs on light surface — so the system overlay
    // stays legible across both modes.
    const statusBarStyle = effective === 'dark' ? 'light' : 'dark';

    return (
        <NoriProvider {...noriProps}>
            <View style={{ flex: 1 }}>
                <StatusBar style={statusBarStyle} />
                <Stack screenOptions={{ headerLargeTitle: false }}>
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen name="components/[slug]" options={{ headerBackTitle: 'Nori UI' }} />
                </Stack>
                <ColorSchemeToggle />
            </View>
        </NoriProvider>
    );
}
