import { theme } from '@nori-ui/tokens';
import type { ViewProps, ViewStyle } from 'react-native';
import { View } from 'react-native';
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

const HORIZONTAL_STYLE: ViewStyle = {
    height: 1,
    width: '100%',
    backgroundColor: theme.semantic.border.default,
};

const VERTICAL_STYLE: ViewStyle = {
    width: 1,
    height: '100%',
    backgroundColor: theme.semantic.border.default,
    alignSelf: 'stretch',
};

/**
 * Visual rule between groups of content. Mirrors Radix's Separator API:
 * `orientation` controls the axis, `decorative` controls whether the rule
 * is announced to screen readers.
 *
 * RSC-safe: pure render, no hooks.
 */
export function Separator({
    orientation = 'horizontal',
    decorative = true,
    className,
    style,
    testID,
    ...rest
}: SeparatorProps) {
    const baseStyle = orientation === 'horizontal' ? HORIZONTAL_STYLE : VERTICAL_STYLE;
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
            style={[baseStyle, style]}
        />
    );
}
