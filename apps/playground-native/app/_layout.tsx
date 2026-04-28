// Stack root for the playground showcase. Mounts NoriProvider once so
// every route inherits theming + i18n, and exposes a deep-linking config
// that aliases `nori-ui://components/<slug>` (the eventual web URL form)
// to the same screen as `nori-ui://component/<slug>` (the file path).

import { NoriProvider } from '@nori-ui/core/client';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export const unstable_settings = {
    // Default route when the app is opened without a deep link.
    initialRouteName: 'index',
};

export default function RootLayout() {
    // NoriProvider already wires `useColorScheme()` internally for theming;
    // we only need to mount it once at the stack root.
    return (
        <NoriProvider>
            <StatusBar style="auto" />
            <Stack
                screenOptions={{
                    // Use the native iOS large-title style on the home
                    // screen to match the reference design; the detail
                    // screen overrides this with a regular header.
                    headerLargeTitle: false,
                }}
            >
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen
                    name="component/[slug]"
                    options={{
                        headerBackTitle: 'Showcase',
                        // The detail screen sets its own header title at
                        // runtime via Stack.Screen inside the route.
                    }}
                />
                {/* Plural alias used by deep links from the web (see Spec B). */}
                <Stack.Screen name="components/[slug]" options={{ headerBackTitle: 'Showcase' }} />
            </Stack>
        </NoriProvider>
    );
}
