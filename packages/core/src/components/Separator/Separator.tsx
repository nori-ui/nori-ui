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
// Vertical: rely on flex `align-self: stretch` to fill the parent's
// row height when the parent has explicit height, AND ship a non-zero
// `min-height` so the rule stays visible inline with text when the
// parent is content-sized. (The previous `height: '100%'` collapsed
// to 0 in content-sized parents — height: 100% of nothing = 0px —
// which made the separator invisible in real layouts like an inline
// action row of Edit / Duplicate / Delete labels.)
const VERTICAL_BASE: ViewStyle = {
    width: 1,
    minHeight: 16,
    alignSelf: 'stretch',
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
