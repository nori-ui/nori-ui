'use client';

import { createContext, useContext } from 'react';

export type ButtonGroupPosition = 'only' | 'first' | 'middle' | 'last';

export type ButtonGroupContextValue = {
    orientation: 'horizontal' | 'vertical';
    /** Where this child sits in the group; decides which corners stay rounded. */
    position: ButtonGroupPosition;
    /** Group-level size. When set it wins over the Button's own `size`. */
    size: 'sm' | 'md' | 'lg' | undefined;
};

export const ButtonGroupContext = createContext<ButtonGroupContextValue | null>(null);

/** Returns the surrounding `<ButtonGroup>` slot info, or `null` outside a group. */
export const useButtonGroupContext = (): ButtonGroupContextValue | null => useContext(ButtonGroupContext);
