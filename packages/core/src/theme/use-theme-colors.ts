'use client';

import { themeDark as dark, theme as light, type Theme } from '@nori-ui/tokens';
import { useColorScheme } from './use-color-scheme';

/**
 * Returns the active token palette — `theme` in light mode, `themeDark`
 * in dark mode. Pulls colors and semantic tokens from `@nori-ui/tokens`.
 *
 * Use this **inside a component** when you need a hex value for a React
 * Native `style` prop (`backgroundColor`, `borderColor`, etc.). For
 * className-based styling on web, the Tailwind `dark:` variants already
 * read the same palette via the tokens preset — no hook needed.
 */
export function useThemeColors(): Theme {
    const scheme = useColorScheme();
    // Cast through `unknown`: the generated `theme` and `themeDark` have
    // identical shape but their semantic hex values are typed as different
    // string literals (e.g. `'#fafafa'` vs `'#18181b'` for background.default),
    // so a direct cast trips TS. Both objects satisfy the `Theme` shape at
    // runtime — the cast just convinces the type checker.
    return scheme === 'dark' ? (dark as unknown as Theme) : light;
}
