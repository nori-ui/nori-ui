'use client';

import type { ViewProps, ViewStyle } from 'react-native';
import { View } from 'react-native';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';

export type SeparatorOrientation = 'horizontal' | 'vertical';

export type SeparatorProps = Omit<ViewProps, 'children'> & {
    /**
     * Visual orientation of the rule.
     * @defaultValue 'horizontal'
     */
    orientation?: SeparatorOrientation;
    /**
     * When true (the default), the separator is purely visual and removed
     * from the accessibility tree. Set to false when the rule is meaningful
     * structure that screen readers should announce.
     * @defaultValue true
     */
    decorative?: boolean;
    className?: string;
    testID?: string;
};

const HORIZONTAL_BASE: ViewStyle = { height: 1, width: '100%' };
// Vertical: a delicate inline rule that sits centered against
// surrounding text. Two design decisions worth recording:
//
//   1. `alignSelf: 'center'` — NOT 'stretch'. Stretch made the rule
//      fill the parent's full row height, which exceeds the visible
//      text glyph height (line-height includes leading padding above
//      and below the glyphs) and made the separator look oversized
//      and asymmetric. Centering it picks up the same visual
//      alignment as the text glyphs.
//
//   2. `height: 16` — matches the body fontSize (1em of body text).
//      In an inline row of body-md text (fontSize 16, lineHeight 1.4
//      → 22.4px box), a 16px-tall rule sits perfectly across the
//      visible glyph zone. Slightly shorter than the full row height
//      gives the rule a refined, intentional look rather than a
//      brutal floor-to-ceiling line.
//
// Consumers who need a separator that fills a taller parent (e.g.
// inside a Card with explicit height) can pass `style={{ height,
// alignSelf: 'stretch' }}` to override.
const VERTICAL_BASE: ViewStyle = {
    width: 1,
    height: 16,
    alignSelf: 'center',
};

/**
 * Visual rule between groups of content. Mirrors Radix's Separator API:
 * `orientation` controls the axis, `decorative` controls whether the rule
 * is announced to screen readers.
 */
export function Separator({
    orientation = 'horizontal',
    decorative = true,
    className,
    style,
    testID,
    ...rest
}: SeparatorProps) {
    const colors = useThemeColors();
    const baseStyle = orientation === 'horizontal' ? HORIZONTAL_BASE : VERTICAL_BASE;
    const a11yProps: Record<string, unknown> = decorative
        ? { role: 'none', accessibilityRole: 'none' as const }
        : {
              role: 'separator',
              accessibilityRole: 'none' as const,
              'aria-orientation': orientation,
          };
    return (
        <View
            {...rest}
            {...a11yProps}
            {...(testID !== undefined ? { testID } : {})}
            className={cn(orientation === 'horizontal' ? 'h-px w-full' : 'w-px h-full self-stretch', className)}
            style={[baseStyle, { backgroundColor: colors.semantic.border.default }, style]}
        />
    );
}
