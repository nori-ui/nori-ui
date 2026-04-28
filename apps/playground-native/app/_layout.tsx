// Stack root for the playground showcase. Mounts NoriProvider once so
// every route inherits theming + i18n. Routes are file-based:
// `app/index.tsx` (home) and `app/components/[slug].tsx` (detail).
// The plural path matches the public web URL form (`/components/<slug>`)
// so deep links and Universal Links share one canonical shape.

import { NoriProvider } from '@nori-ui/core/client';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export const unstable_settings = {
    initialRouteName: 'index',
};

export default function RootLayout() {
    return (
        <NoriProvider>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerLargeTitle: false }}>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="components/[slug]" options={{ headerBackTitle: 'Showcase' }} />
            </Stack>
        </NoriProvider>
    );
}
