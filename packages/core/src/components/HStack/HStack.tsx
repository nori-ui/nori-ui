import type { ViewProps } from 'react-native';
import { View } from 'react-native';
import { cn } from '../../utils/cn';
import { wrapStringChildren } from '../../utils/wrap-string-children';

export type StackGap = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
export type StackAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';

export type HStackProps = ViewProps & {
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
 * Horizontal flex layout primitive. RSC-safe.
 */
export function HStack({ gap, align, justify, className, children, ...rest }: HStackProps) {
    return (
        <View
            {...rest}
            className={cn(
                'flex-row',
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
