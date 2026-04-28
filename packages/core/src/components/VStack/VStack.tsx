import type { ViewProps } from 'react-native';
import { View } from 'react-native';
import { cn } from '../../utils/cn';
import { wrapStringChildren } from '../../utils/wrap-string-children';
import type { StackAlign, StackGap, StackJustify } from '../HStack/HStack';

export type VStackProps = ViewProps & {
    gap?: StackGap;
    align?: StackAlign;
    justify?: StackJustify;
    className?: string;
    testID?: string;
};

const ALIGN_CLASS: Record<StackAlign, string> = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
    baseline: 'items-baseline',
};

const JUSTIFY_CLASS: Record<StackJustify, string> = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
};

/**
 * Vertical flex layout primitive. RSC-safe.
 */
export function VStack({ gap, align, justify, className, children, ...rest }: VStackProps) {
    return (
        <View
            {...rest}
            className={cn(
                'flex-col',
                gap !== undefined && gap !== 0 ? `gap-${gap}` : undefined,
                align !== undefined ? ALIGN_CLASS[align] : undefined,
                justify !== undefined ? JUSTIFY_CLASS[justify] : undefined,
                className
            )}
        >
            {wrapStringChildren(children)}
        </View>
    );
}
