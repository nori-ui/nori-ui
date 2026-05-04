'use client';

import type { Theme } from '@nori-ui/tokens';
import { type KeyboardEvent, type ReactNode, useCallback, useState } from 'react';
import type { ViewStyle } from 'react-native';
import { Pressable, Text as RNText, View } from 'react-native';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';
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

// Layout-only bases; theme-driven dimensions are merged inside the component.
const CONTAINER_LAYOUT_BASE: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'stretch',
};

const SEGMENT_LAYOUT_BASE: ViewStyle = {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
};

// Token keys per size; resolved to px inside the component so theme
// overrides take effect.
type SegmentSizeKeys = {
    paddingV: keyof Theme['spacing'];
    paddingH: keyof Theme['spacing'];
    font: keyof Theme['fontSize'];
};
const SEGMENT_SIZE_KEYS: Record<SegmentedControlSize, SegmentSizeKeys> = {
    sm: { paddingV: '1', paddingH: '2', font: 'sm' }, // 4 / 8 / 14 — closest to legacy 4/10/13
    md: { paddingV: '2', paddingH: '3', font: 'sm' }, // 8 / 12 / 14 — closest to legacy 6/12/14
};

const SEGMENT_SELECTED_BASE: ViewStyle = {
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
export const SegmentedControl = <T extends string>({
    value,
    defaultValue,
    onChange,
    options,
    disabled = false,
    size = 'md',
    label,
    className,
    testID,
}: SegmentedControlProps<T>) => {
    const colors = useThemeColors();
    const [inner, setInner] = useState<T | undefined>(defaultValue);
    const isControlled = value !== undefined;
    const current = isControlled ? value : inner;

    const select = useCallback(
        (next: T) => {
            if (disabled) {
                return;
            }
            if (!isControlled) {
                setInner(next);
            }
            onChange?.(next);
        },
        [disabled, isControlled, onChange]
    );

    const handleKeyDown = useCallback(
        (event: KeyboardEvent<HTMLDivElement>) => {
            if (options.length === 0) {
                return;
            }
            const idx = options.findIndex((o) => o.value === current);
            const start = idx === -1 ? 0 : idx;
            const offset =
                event.key === 'ArrowRight' || event.key === 'ArrowDown'
                    ? 1
                    : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
                      ? -1
                      : 0;
            if (offset === 0 && event.key !== 'Home' && event.key !== 'End') {
                return;
            }
            event.preventDefault();
            let nextIdx: number;
            if (event.key === 'Home') {
                nextIdx = 0;
            } else if (event.key === 'End') {
                nextIdx = options.length - 1;
            } else {
                nextIdx = (start + offset + options.length) % options.length;
            }
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

    const sizeKeys = SEGMENT_SIZE_KEYS[size];
    const segmentPadV = px(colors.spacing[sizeKeys.paddingV]);
    const segmentPadH = px(colors.spacing[sizeKeys.paddingH]);
    const segmentFontSize = px(colors.fontSize[sizeKeys.font]);

    const groupProps: Record<string, unknown> = {
        role: 'radiogroup',
        accessibilityRole: 'radiogroup',
        onKeyDown: handleKeyDown,
        ...(label !== undefined ? { 'aria-label': label, accessibilityLabel: label } : {}),
        ...(disabled ? { 'aria-disabled': true } : {}),
        ...(testID !== undefined ? { testID } : {}),
    };

    const containerStyle: ViewStyle = {
        ...CONTAINER_LAYOUT_BASE,
        borderRadius: px(colors.radius.lg),
        padding: px(colors.spacing['1']),
        gap: px(colors.spacing['1']),
        backgroundColor: colors.semantic.background.subtle,
    };
    const segmentBaseStyle: ViewStyle = {
        ...SEGMENT_LAYOUT_BASE,
        borderRadius: px(colors.radius.md),
    };
    const segmentSelectedStyle: ViewStyle = {
        ...SEGMENT_SELECTED_BASE,
        backgroundColor: colors.semantic.background.elevated,
    };

    return (
        <View
            {...groupProps}
            className={cn(
                'inline-flex flex-row items-stretch rounded-lg bg-neutral-100 dark:bg-neutral-800 p-1 gap-1',
                disabled ? 'opacity-60' : undefined,
                className
            )}
            style={[containerStyle, disabled ? { opacity: 0.6 } : null]}
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
                            if (!isOptDisabled) {
                                select(option.value);
                            }
                        }}
                        {...(isOptDisabled ? { 'aria-disabled': true, disabled: true } : {})}
                        className={cn(
                            'flex-1 items-center justify-center rounded-md',
                            selected ? 'bg-semantic-background-elevated shadow-sm' : '',
                            isOptDisabled ? 'opacity-50' : ''
                        )}
                        style={[
                            segmentBaseStyle,
                            { paddingVertical: segmentPadV, paddingHorizontal: segmentPadH },
                            selected ? segmentSelectedStyle : null,
                            isOptDisabled ? { opacity: 0.5 } : null,
                        ]}
                    >
                        {typeof option.label === 'string' ? (
                            <RNText
                                style={{
                                    color: selected ? colors.semantic.text.default : colors.semantic.text.muted,
                                    fontFamily: colors.fontFamily.body,
                                    fontSize: segmentFontSize,
                                    fontWeight: selected
                                        ? (colors.fontWeight.semibold as '600')
                                        : (colors.fontWeight.medium as '500'),
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
};
