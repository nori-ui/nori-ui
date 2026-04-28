import type { ViewProps, ViewStyle } from 'react-native';
import { View } from 'react-native';
import { cn } from '../../utils/cn';
import { wrapStringChildren } from '../../utils/wrap-string-children';

export type BoxProps = ViewProps & {
    className?: string;
    testID?: string;
    /**
     * Flex grow factor for proportional layouts inside HStack / VStack.
     *
     * In an HStack with three children of `flex={1}`, each takes one third
     * of the available width. For a 20/60/20 split: `flex={1}`, `flex={3}`,
     * `flex={1}` — the values are ratios, not percentages.
     *
     * Maps directly to React Native / web flexbox `flex` style.
     */
    flex?: number;
};

/**
 * Generic layout primitive. Wraps react-native's `<View>` with className
 * support and a `flex` prop for proportional layouts. RSC-safe.
 */
export function Box({ className, children, flex, style, ...rest }: BoxProps) {
    const flexStyle: ViewStyle | undefined = flex === undefined ? undefined : { flex };
    const merged = flexStyle === undefined ? style : style === undefined ? flexStyle : [flexStyle, style];
    return (
        <View {...rest} className={cn(className)} style={merged}>
            {wrapStringChildren(children)}
        </View>
    );
}
