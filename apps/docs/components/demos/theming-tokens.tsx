'use client';

import { Button, defaultTheme, type NoriTheme, ThemeProvider, VStack } from '@nori-ui/core/client';

// Same teal palette as the default — the only thing that changes is the
// dimensional + typographic tokens. Bigger radius, fatter padding,
// different font ramp, heavier baseline weight. Demonstrates that a
// theme isn't just a color skin — it can scale the whole system.
const ROUNDED_THEME: NoriTheme = {
    light: {
        ...defaultTheme.light,
        radius: { ...defaultTheme.light.radius, md: '14px', lg: '20px' },
        spacing: { ...defaultTheme.light.spacing, '3': '16px', '4': '20px', '5': '24px' },
        fontSize: { ...defaultTheme.light.fontSize, sm: '15px', md: '17px', lg: '19px' },
        fontWeight: { ...defaultTheme.light.fontWeight, medium: '600' },
        fontFamily: {
            ...defaultTheme.light.fontFamily,
            body: 'Georgia, "Times New Roman", serif',
        },
    },
    dark: {
        ...defaultTheme.dark,
        radius: { ...defaultTheme.dark.radius, md: '14px', lg: '20px' },
        spacing: { ...defaultTheme.dark.spacing, '3': '16px', '4': '20px', '5': '24px' },
        fontSize: { ...defaultTheme.dark.fontSize, sm: '15px', md: '17px', lg: '19px' },
        fontWeight: { ...defaultTheme.dark.fontWeight, medium: '600' },
        fontFamily: {
            ...defaultTheme.dark.fontFamily,
            body: 'Georgia, "Times New Roman", serif',
        },
    },
};

/**
 * Side-by-side: same components, two different themes. The right pair
 * uses ROUNDED_THEME — bumped border-radius, wider padding, slightly
 * larger fontSize, heavier "medium" weight, and a serif body face.
 * Nothing about the components changed; the theme did all the work.
 */
export default function ThemingTokens() {
    return (
        <VStack gap={5}>
            <ThemeProvider>
                <VStack gap={2}>
                    <Button>Default theme</Button>
                    <Button variant="secondary">Default secondary</Button>
                </VStack>
            </ThemeProvider>
            <ThemeProvider theme={ROUNDED_THEME}>
                <VStack gap={2}>
                    <Button>Rounded · serif theme</Button>
                    <Button variant="secondary">Rounded · serif secondary</Button>
                </VStack>
            </ThemeProvider>
        </VStack>
    );
}
