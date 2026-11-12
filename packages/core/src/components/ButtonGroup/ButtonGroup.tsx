'use client';

import { Children, isValidElement, type ReactNode, useMemo } from 'react';
import type { ViewStyle } from 'react-native';
import { View } from 'react-native';
import { cn } from '../../utils/cn';
import { ButtonGroupContext, type ButtonGroupContextValue, type ButtonGroupPosition } from './button-group-context';

export type ButtonGroupOrientation = 'horizontal' | 'vertical';
export type ButtonGroupSize = 'sm' | 'md' | 'lg';

export type ButtonGroupProps = {
    children?: ReactNode;
    /** Flex direction for the group. @defaultValue 'horizontal' */
    orientation?: ButtonGroupOrientation;
    /**
     * Size applied to every Button inside the group, overriding each
     * Button's own `size`. When omitted, each Button retains its own `size`
     * prop.
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
 * Each direct child is told its position (first / middle / last) and the
 * group's `size` through context; `Button` reads it to drop the corner
 * radius on its joined edges and to size itself. This works the same on web
 * and native.
 *
 * ```tsx
 * <ButtonGroup>
 *   <Button variant="secondary">Day</Button>
 *   <Button variant="secondary">Week</Button>
 *   <Button variant="secondary">Month</Button>
 * </ButtonGroup>
 * ```
 */
export const ButtonGroup = ({ children, orientation = 'horizontal', size, className, testID }: ButtonGroupProps) => {
    const isHorizontal = orientation === 'horizontal';

    const containerStyle: ViewStyle = {
        flexDirection: isHorizontal ? 'row' : 'column',
        // gap: 0 so buttons touch and read as one joined control.
        gap: 0,
        alignSelf: 'flex-start',
        overflow: 'hidden',
    };

    const childArray = Children.toArray(children).filter(isValidElement);
    const total = childArray.length;

    const clonedChildren = childArray.map((child, index) => {
        const position: ButtonGroupPosition =
            total === 1 ? 'only' : index === 0 ? 'first' : index === total - 1 ? 'last' : 'middle';
        return (
            <ButtonGroupSlot key={child.key ?? index} orientation={orientation} position={position} size={size}>
                {child}
            </ButtonGroupSlot>
        );
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

const ButtonGroupSlot = ({
    orientation,
    position,
    size,
    children,
}: {
    orientation: ButtonGroupOrientation;
    position: ButtonGroupPosition;
    size: ButtonGroupSize | undefined;
    children: ReactNode;
}) => {
    const value = useMemo<ButtonGroupContextValue>(
        () => ({ orientation, position, size }),
        [orientation, position, size]
    );
    return <ButtonGroupContext.Provider value={value}>{children}</ButtonGroupContext.Provider>;
};
