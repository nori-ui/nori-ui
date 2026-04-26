'use client';

import { theme } from '@nori-ui/tokens';
import { type KeyboardEvent, type ReactNode, useCallback, useState } from 'react';
import type { ViewStyle } from 'react-native';
import { Pressable, Text as RNText, View } from 'react-native';
import { cn } from '../../utils/cn';

export type SegmentedControlSize = 'sm' | 'md';

export type SegmentedControlOption<T extends string = string> = {
    value: T;
    label: ReactNode;
    /** Disable just this option. */
    disabled?: boolean;
};

export type SegmentedControlProps<T extends string = string> = {
    /** Controlled value. */
    value?: T;
    /** Uncontrolled initial value. Required if you don't pass `value`. */
    defaultValue?: T;
    /** Fires when the user selects a different segment. */
    onChange?: (next: T) => void;
    /** The set of selectable segments. */
    options: ReadonlyArray<SegmentedControlOption<T>>;
    /** Group-level disable. */
    disabled?: boolean;
    /**
     * Visual size. `sm` is denser for inline filters; `md` is the default
     * for top-of-view tab switchers.
     * @defaultValue 'md'
     */
    size?: SegmentedControlSize;
    /** Hide the visible labels — when set, segments must have `aria-label`. */
    label?: string;
    className?: string;
    testID?: string;
};

const CONTAINER_STYLE: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: theme.color.neutral['100'],
    borderRadius: 8,
    padding: 4,
    gap: 4,
};

const SEGMENT_BASE: ViewStyle = {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
};

const SEGMENT_SIZE: Record<SegmentedControlSize, { paddingV: number; paddingH: number; fontSize: number }> = {
    sm: { paddingV: 4, paddingH: 10, fontSize: 13 },
    md: { paddingV: 6, paddingH: 12, fontSize: 14 },
};

const SEGMENT_SELECTED: ViewStyle = {
    backgroundColor: theme.semantic.background.elevated,
    // Subtle elevation that says "this one is on" without overshadowing
    // the unselected segments next to it. Web uses boxShadow (CSS-style);
    // native uses elevation. The legacy RN `shadow*` props were deprecated
    // by react-native-web in favor of `boxShadow`.
    ...({ boxShadow: '0 1px 2px rgba(0, 0, 0, 0.06)' } as ViewStyle),
    elevation: 1,
};

/**
 * Single-select segmented switcher — the "beautiful UISegmentedControl"
 * pattern. Use for binary or small (3–5 option) choices that fit inline
 * with their surrounding content. Reach for `Tabs` when each option owns
 * a distinct content region.
 *
 * Keyboard nav follows the WAI-ARIA radiogroup pattern: arrow keys move
 * between options (selection follows focus), `Home` / `End` jump to first
 * / last, with wrap-around at the edges.
 */
export function SegmentedControl<T extends string>({
    value,
    defaultValue,
    onChange,
    options,
    disabled = false,
    size = 'md',
    label,
    className,
    testID,
}: SegmentedControlProps<T>) {
    const [inner, setInner] = useState<T | undefined>(defaultValue);
    const isControlled = value !== undefined;
    const current = isControlled ? value : inner;

    const select = useCallback(
        (next: T) => {
            if (disabled) return;
            if (!isControlled) setInner(next);
            onChange?.(next);
        },
        [disabled, isControlled, onChange]
    );

    const handleKeyDown = useCallback(
        (event: KeyboardEvent<HTMLDivElement>) => {
            if (options.length === 0) return;
            const idx = options.findIndex((o) => o.value === current);
            const start = idx === -1 ? 0 : idx;
            const offset =
                event.key === 'ArrowRight' || event.key === 'ArrowDown'
                    ? 1
                    : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
                      ? -1
                      : 0;
            if (offset === 0 && event.key !== 'Home' && event.key !== 'End') return;
            event.preventDefault();
            let nextIdx: number;
            if (event.key === 'Home') nextIdx = 0;
            else if (event.key === 'End') nextIdx = options.length - 1;
            else nextIdx = (start + offset + options.length) % options.length;
            // Skip past disabled options in the chosen direction.
            const direction = offset === 0 ? 1 : offset;
            for (let attempts = 0; attempts < options.length; attempts += 1) {
                const candidate = options[nextIdx];
                if (candidate && !candidate.disabled) {
                    select(candidate.value);
                    return;
                }
                nextIdx = (nextIdx + direction + options.length) % options.length;
            }
        },
        [current, options, select]
    );

    const sizeTokens = SEGMENT_SIZE[size];

    const groupProps: Record<string, unknown> = {
        role: 'radiogroup',
        accessibilityRole: 'radiogroup',
        onKeyDown: handleKeyDown,
        ...(label !== undefined ? { 'aria-label': label, accessibilityLabel: label } : {}),
        ...(disabled ? { 'aria-disabled': true } : {}),
        ...(testID !== undefined ? { testID } : {}),
    };

    return (
        <View
            {...groupProps}
            className={cn(
                'inline-flex flex-row items-stretch rounded-lg bg-neutral-100 p-1 gap-1',
                disabled ? 'opacity-60' : undefined,
                className
            )}
            style={[CONTAINER_STYLE, disabled ? { opacity: 0.6 } : null]}
        >
            {options.map((option) => {
                const selected = option.value === current;
                const isOptDisabled = disabled || option.disabled;
                return (
                    <Pressable
                        key={option.value}
                        role="radio"
                        accessibilityRole="radio"
                        aria-checked={selected}
                        accessibilityState={{ selected, disabled: Boolean(isOptDisabled) }}
                        tabIndex={selected || (current === undefined && options[0]?.value === option.value) ? 0 : -1}
                        onPress={() => {
                            if (!isOptDisabled) select(option.value);
                        }}
                        {...(isOptDisabled ? { 'aria-disabled': true, disabled: true } : {})}
                        className={cn(
                            'flex-1 items-center justify-center rounded-md',
                            selected ? 'bg-semantic-background-elevated shadow-sm' : '',
                            isOptDisabled ? 'opacity-50' : ''
                        )}
                        style={[
                            SEGMENT_BASE,
                            { paddingVertical: sizeTokens.paddingV, paddingHorizontal: sizeTokens.paddingH },
                            selected ? SEGMENT_SELECTED : null,
                            isOptDisabled ? { opacity: 0.5 } : null,
                        ]}
                    >
                        {typeof option.label === 'string' ? (
                            <RNText
                                style={{
                                    color: selected ? theme.semantic.text.default : theme.semantic.text.muted,
                                    fontSize: sizeTokens.fontSize,
                                    fontWeight: selected ? '600' : '500',
                                }}
                            >
                                {option.label}
                            </RNText>
                        ) : (
                            option.label
                        )}
                    </Pressable>
                );
            })}
        </View>
    );
}
