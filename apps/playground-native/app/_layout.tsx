// Stack root for the playground showcase. Mounts NoriProvider once so
// every route inherits theming + i18n. Routes are file-based:
// `app/index.tsx` (home) and `app/components/[slug].tsx` (detail).
// The plural path matches the public web URL form (`/components/<slug>`)
// so deep links and Universal Links share one canonical shape.
//
// `colorScheme` flows from the app-level `<PlaygroundColorSchemeProvider>`
// so the floating toggle (rendered as a sibling of the stack) can flip
// the scheme for every screen.

import { Toaster } from '@nori-ui/core';
import { NoriProvider } from '@nori-ui/core/client';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
        // GestureHandlerRootView is required by `sonner-native` for
        // swipe-to-dismiss; it must wrap the entire app so any descendant
        // pan recognizers reach the gesture system.
        //
        // SafeAreaProvider feeds `useSafeAreaInsets` to the Toaster so
        // top-anchored toasts clear the status bar / dynamic island,
        // and bottom-anchored toasts clear the home indicator. Without
        // it the insets default to zero and toasts collide with system
        // UI. expo-router adds its own SafeAreaProvider around <Stack>,
        // but our <Toaster> is a SIBLING of <Stack> — outside that
        // subtree — so we hoist a top-level provider here.
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <NoriProvider {...noriProps}>
                    <View style={{ flex: 1 }}>
                        <StatusBar style={statusBarStyle} />
                        <Stack screenOptions={{ headerLargeTitle: false }}>
                            <Stack.Screen name="index" options={{ headerShown: false }} />
                            <Stack.Screen name="components/[slug]" options={{ headerBackTitle: 'Nori UI' }} />
                        </Stack>
                        <ColorSchemeToggle />
                        {/* Toast viewport. One mount near the app root drives
                            every `toast(...)` call across all screens. */}
                        <Toaster position="top-center" visibleToasts={3} expand />
                    </View>
                </NoriProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
