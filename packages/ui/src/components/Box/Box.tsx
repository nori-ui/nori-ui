import type { ViewProps } from 'react-native';
import { View } from 'react-native';
import { cn } from '../../utils/cn';

export type BoxProps = ViewProps & {
    className?: string;
    testID?: string;
};

/**
 * Generic layout primitive. Wraps react-native's <View> with className support.
 * RSC-safe.
 */
export function Box({ className, children, ...rest }: BoxProps) {
    return (
        <View {...rest} className={cn(className)}>
            {children}
        </View>
    );
}
