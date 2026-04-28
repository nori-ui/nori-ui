import type { ViewProps, ViewStyle } from 'react-native';
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

const ALIGN_STYLE: Record<StackAlign, ViewStyle['alignItems']> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch',
    baseline: 'baseline',
};

const JUSTIFY_STYLE: Record<StackJustify, ViewStyle['justifyContent']> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    between: 'space-between',
    around: 'space-around',
    evenly: 'space-evenly',
};

const GAP_PX: Record<StackGap, number> = {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
};

/**
 * Vertical flex layout primitive. RSC-safe.
 *
 * Layout is driven by inline style; see HStack for the rationale.
 */
export function VStack({ gap, align, justify, className, children, style, ...rest }: VStackProps) {
    const inline: ViewStyle = { flexDirection: 'column' };
    if (gap !== undefined && gap !== 0) {
        inline.gap = GAP_PX[gap];
    }
    if (align !== undefined) {
        inline.alignItems = ALIGN_STYLE[align];
    }
    if (justify !== undefined) {
        inline.justifyContent = JUSTIFY_STYLE[justify];
    }
    const merged = style === undefined ? inline : ([inline, style] as ViewStyle[]);
    return (
        <View
            {...rest}
            style={merged}
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
