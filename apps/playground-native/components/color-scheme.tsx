// App-level color-scheme control. Three states:
//   - 'auto'  → follow OS Appearance (default)
//   - 'light' → forced light
//   - 'dark'  → forced dark
//
// `_layout.tsx` reads `effective` and passes it to `<NoriProvider>`'s
// `colorScheme` prop (or omits it when 'auto', so library components
// fall back to OS detection). The floating toggle cycles through the
// three states in user-visible order: auto → light → dark → auto.
//
// Persistence is intentionally NOT wired up yet — that needs
// @react-native-async-storage/async-storage, a native module addition
// which would require rebuilding the Expo dev client. v1 keeps state
// in memory; a cold app launch resets to 'auto'. Easy follow-up.

import { type ColorScheme } from '@nori-ui/core/client';
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useColorScheme as useOSColorScheme, View } from 'react-native';

export type ColorSchemeMode = 'auto' | 'light' | 'dark';

type ColorSchemeContextValue = {
    /** User's chosen mode — what the toggle reflects. */
    mode: ColorSchemeMode;
    /** Resolved scheme: `mode` if 'light' or 'dark', else the OS scheme. */
    effective: ColorScheme;
    /** Cycle to the next state in auto → light → dark → auto order. */
    cycle: () => void;
};

const ColorSchemeContext = createContext<ColorSchemeContextValue | null>(null);
ColorSchemeContext.displayName = 'PlaygroundColorSchemeContext';

const NEXT_MODE: Record<ColorSchemeMode, ColorSchemeMode> = {
    auto: 'light',
    light: 'dark',
    dark: 'auto',
};

export function PlaygroundColorSchemeProvider({ children }: { children: ReactNode }) {
    const osScheme = useOSColorScheme();
    const [mode, setMode] = useState<ColorSchemeMode>('auto');

    const cycle = useCallback(() => {
        setMode((m) => NEXT_MODE[m]);
    }, []);

    const value = useMemo<ColorSchemeContextValue>(() => {
        const effective: ColorScheme = mode === 'auto' ? ((osScheme ?? 'light') as ColorScheme) : mode;
        return { mode, effective, cycle };
    }, [mode, osScheme, cycle]);

    return <ColorSchemeContext.Provider value={value}>{children}</ColorSchemeContext.Provider>;
}

export function usePlaygroundColorScheme(): ColorSchemeContextValue {
    const ctx = useContext(ColorSchemeContext);
    if (!ctx) {
        throw new Error('usePlaygroundColorScheme must be used inside <PlaygroundColorSchemeProvider>');
    }
    return ctx;
}

// Glyphs deliberately monochrome and symbolic. The toggle button is small
// and meant to read at a glance — emojis (🌞 🌙) carry too much color and
// fight the chrome. Unicode astrology/geometric chars stay neutral and
// inherit the surrounding text color.
const GLYPH: Record<ColorSchemeMode, string> = {
    auto: '◐',
    light: '☀',
    dark: '☾',
};

const ARIA_LABEL: Record<ColorSchemeMode, string> = {
    auto: 'Color scheme: auto (follow system). Tap to switch to light.',
    light: 'Color scheme: light. Tap to switch to dark.',
    dark: 'Color scheme: dark. Tap to switch to auto.',
};

/**
 * Floating color-scheme toggle. Mounted once at the app root, sits
 * bottom-right of the safe area, visible on every screen. Tap cycles
 * auto → light → dark → auto.
 */
export function ColorSchemeToggle() {
    const { mode, effective, cycle } = usePlaygroundColorScheme();

    // Style the button against the EFFECTIVE scheme so it stays legible
    // against whatever the rest of the chrome is showing.
    const isDark = effective === 'dark';
    const bg = isDark ? 'rgba(20,20,20,0.85)' : 'rgba(250,250,250,0.85)';
    const fg = isDark ? '#fafafa' : '#18181b';
    const border = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';

    return (
        <View pointerEvents="box-none" style={styles.wrap}>
            <Pressable
                testID="color-scheme-toggle"
                accessibilityRole="button"
                accessibilityLabel={ARIA_LABEL[mode]}
                accessibilityState={{ selected: mode !== 'auto' }}
                onPress={cycle}
                style={({ pressed }) => [
                    styles.button,
                    {
                        backgroundColor: bg,
                        borderColor: border,
                        opacity: pressed ? 0.7 : 1,
                    },
                ]}
            >
                <Text style={[styles.glyph, { color: fg }]}>{GLYPH[mode]}</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        position: 'absolute',
        right: 16,
        bottom: 32,
        zIndex: 1000,
    },
    button: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
        elevation: 4,
    },
    glyph: {
        fontSize: 20,
        lineHeight: 22,
    },
});
