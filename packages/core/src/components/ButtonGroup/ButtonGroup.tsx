'use client';

import { Children, cloneElement, isValidElement, type ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import { View } from 'react-native';
import { cn } from '../../utils/cn';

export type ButtonGroupOrientation = 'horizontal' | 'vertical';
export type ButtonGroupSize = 'sm' | 'md' | 'lg';

export type ButtonGroupProps = {
    children?: ReactNode;
    /** Flex direction for the group. @defaultValue 'horizontal' */
    orientation?: ButtonGroupOrientation;
    /**
     * Size hint passed to children via `data-group-size`. Buttons inside
     * the group can read this to self-size consistently. When omitted, each
     * Button retains its own `size` prop.
     */
    size?: ButtonGroupSize;
    className?: string;
    testID?: string;
};

/**
 * Joins multiple buttons in a visually connected row (or column). Middle
 * buttons lose outer edge radius; adjacent borders merge so the group looks
 * like a single segmented control.
 *
 * The radius treatment is implemented by injecting `data-position` attributes
 * (first / middle / last) onto each direct child. A companion CSS rule in the
 * nori preset (or a Tailwind variant) can target `[data-position=first]`,
 * `[data-position=middle]`, and `[data-position=last]` to strip the
 * appropriate border-radius corners. When using Button from `@nori-ui/core`,
 * no extra setup is needed — the tokens preset ships the rules.
 *
 * ```tsx
 * <ButtonGroup>
 *   <Button variant="secondary">Day</Button>
 *   <Button variant="secondary">Week</Button>
 *   <Button variant="secondary">Month</Button>
 * </ButtonGroup>
 * ```
 *
 * > **v2 note:** Corner-radius stripping is applied via CSS data-attribute
 * > selectors on web. On native, middle-button radius adjustment is a future
 * > enhancement (currently the group renders with standard per-button radius).
 */
export const ButtonGroup = ({ children, orientation = 'horizontal', size, className, testID }: ButtonGroupProps) => {
    const isHorizontal = orientation === 'horizontal';

    const containerStyle: ViewStyle = {
        flexDirection: isHorizontal ? 'row' : 'column',
        // gap: 0 so buttons touch; shared-border effect comes from CSS on web
        // and from touching edges on native.
        gap: 0,
        alignSelf: 'flex-start',
        overflow: 'hidden',
    };

    // Inject `data-position` on each valid child so CSS (web) or future
    // native logic can target first / middle / last positions.
    const childArray = Children.toArray(children).filter(isValidElement);
    const total = childArray.length;

    const clonedChildren = childArray.map((child, index) => {
        const position = index === 0 ? 'first' : index === total - 1 ? 'last' : 'middle';
        const extraProps: Record<string, unknown> = {
            'data-position': position,
            'data-group-orientation': orientation,
        };
        if (size !== undefined) {
            extraProps['data-group-size'] = size;
        }

        // Clone the child element with the injected data attributes.
        return cloneElement(child, extraProps);
    });

    return (
        <View
            {...(testID !== undefined ? { testID } : {})}
            className={cn(isHorizontal ? 'flex-row' : 'flex-col', 'self-start overflow-hidden', className)}
            style={containerStyle}
        >
            {clonedChildren}
        </View>
    );
};
