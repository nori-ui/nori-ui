'use client';

import type { CalendarDate } from '@internationalized/date';
import { getLocalTimeZone } from '@internationalized/date';
import { useCallback, useState } from 'react';
import { Platform, Pressable, Text as RNText, View } from 'react-native';
import { useLocale } from '../../i18n/locale';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';
import type { DateRange } from '../Calendar';
import { Calendar } from '../Calendar';
import { Popover } from '../Popover';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a single CalendarDate for display using Intl. */
function formatDate(date: CalendarDate, locale: string): string {
    try {
        return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date.toDate(getLocalTimeZone()));
    } catch {
        return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
    }
}

// ---------------------------------------------------------------------------
// Calendar icon
// ---------------------------------------------------------------------------

function CalendarIcon({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
    const colors = useThemeColors();

    if (Platform.OS === 'web') {
        return (
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
            </svg>
        );
    }

    const resolvedColor = color === 'currentColor' ? colors.semantic.text.muted : color;
    return (
        <RNText
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{ fontSize: size, lineHeight: size, color: resolvedColor }}
        >
            {'📅'}
        </RNText>
    );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DatePickerProps = {
    value?: CalendarDate | null;
    defaultValue?: CalendarDate | null;
    onChange?: (date: CalendarDate | null) => void;

    /** BCP 47 locale; defaults from NoriProvider's i18n context. */
    locale?: string;

    /** Min/max selectable date. */
    minValue?: CalendarDate;
    maxValue?: CalendarDate;

    /** Custom unavailable predicate. */
    isDateUnavailable?: (date: CalendarDate) => boolean;

    /** First day of week override (0=Sun, 1=Mon, ...). Defaults from locale. */
    firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;

    /** Placeholder text shown when no value. */
    placeholder?: string;

    /** Disable the whole picker. */
    disabled?: boolean;

    // A11y / Field.Control hook props
    id?: string;
    name?: string;
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
    'aria-required'?: boolean;

    testID?: string;
    className?: string;
};

export type DateRangeValue = { start: CalendarDate | null; end: CalendarDate | null };

export type DatePickerRangeProps = {
    value?: DateRangeValue;
    defaultValue?: DateRangeValue;
    onChange?: (range: DateRangeValue) => void;

    locale?: string;
    minValue?: CalendarDate;
    maxValue?: CalendarDate;
    isDateUnavailable?: (date: CalendarDate) => boolean;
    firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    placeholder?: string;
    disabled?: boolean;

    id?: string;
    name?: string;
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
    'aria-required'?: boolean;

    testID?: string;
    className?: string;
};

// ---------------------------------------------------------------------------
// Shared Calendar optional props builder
// ---------------------------------------------------------------------------

type CalendarOptional = {
    minValue?: CalendarDate;
    maxValue?: CalendarDate;
    isDateUnavailable?: (date: CalendarDate) => boolean;
    firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
};

function buildCalendarOptional(
    minValue: CalendarDate | undefined,
    maxValue: CalendarDate | undefined,
    isDateUnavailable: ((date: CalendarDate) => boolean) | undefined,
    firstDayOfWeek: (0 | 1 | 2 | 3 | 4 | 5 | 6) | undefined
): CalendarOptional {
    const out: CalendarOptional = {};
    if (minValue !== undefined) {
        out.minValue = minValue;
    }
    if (maxValue !== undefined) {
        out.maxValue = maxValue;
    }
    if (isDateUnavailable !== undefined) {
        out.isDateUnavailable = isDateUnavailable;
    }
    if (firstDayOfWeek !== undefined) {
        out.firstDayOfWeek = firstDayOfWeek;
    }
    return out;
}

function buildTriggerAriaProps(ariaProps: {
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
    'aria-required'?: boolean;
}): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    if (ariaProps['aria-labelledby'] !== undefined) {
        out['aria-labelledby'] = ariaProps['aria-labelledby'];
    }
    if (ariaProps['aria-describedby'] !== undefined) {
        out['aria-describedby'] = ariaProps['aria-describedby'];
    }
    if (ariaProps['aria-invalid'] !== undefined) {
        out['aria-invalid'] = ariaProps['aria-invalid'];
    }
    if (ariaProps['aria-required'] !== undefined) {
        out['aria-required'] = ariaProps['aria-required'];
    }
    return out;
}

// ---------------------------------------------------------------------------
// DatePicker (single)
//
// Uses Popover.Trigger + asChild so the Popover correctly sets the trigger
// ref for web positioning and handles outside-click dismissal.
// The trigger renders as a Pressable (via Popover.Trigger asChild pattern).
// ---------------------------------------------------------------------------

const DatePickerRoot = ({
    value,
    defaultValue,
    onChange,
    locale: localeProp,
    minValue,
    maxValue,
    isDateUnavailable,
    firstDayOfWeek,
    placeholder,
    disabled = false,
    id,
    name: _name,
    className,
    testID,
    ...ariaProps
}: DatePickerProps) => {
    const providerLocale = useLocale();
    const locale = localeProp ?? providerLocale;

    const [open, setOpen] = useState(false);

    const isControlled = value !== undefined;
    const [inner, setInner] = useState<CalendarDate | null>(defaultValue ?? null);
    const current = isControlled ? (value ?? null) : inner;

    const handleChange = useCallback(
        (date: CalendarDate | null) => {
            if (!isControlled) {
                setInner(date);
            }
            onChange?.(date);
            setOpen(false);
        },
        [isControlled, onChange]
    );

    const handleOpenChange = useCallback(
        (next: boolean) => {
            if (!disabled) {
                setOpen(next);
            }
        },
        [disabled]
    );

    const displayValue = current ? formatDate(current, locale) : null;
    const calendarOptional = buildCalendarOptional(minValue, maxValue, isDateUnavailable, firstDayOfWeek);
    const triggerAriaProps = buildTriggerAriaProps(ariaProps);

    const colors = useThemeColors();
    const hasError = ariaProps['aria-invalid'] === true || (ariaProps['aria-invalid'] as unknown as string) === 'true';

    const pressableStyle = {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        borderWidth: 1,
        borderRadius: px(colors.radius.md),
        paddingHorizontal: px(colors.spacing['3']),
        paddingVertical: px(colors.spacing['2']),
        backgroundColor: colors.semantic.background.elevated,
        borderColor: hasError ? colors.color.danger : colors.semantic.border.default,
        opacity: disabled ? 0.6 : 1,
    };

    const textStyle = {
        flex: 1,
        fontFamily: colors.fontFamily.body,
        fontSize: px(colors.fontSize.md),
        color: displayValue ? colors.semantic.text.default : colors.semantic.text.muted,
    };

    // Extra a11y props for the trigger
    const triggerExtraProps: Record<string, unknown> = {
        role: 'combobox',
        accessibilityRole: 'button',
        'aria-haspopup': 'dialog',
        'aria-expanded': open,
        ...triggerAriaProps,
    };
    if (id !== undefined) {
        triggerExtraProps.id = id;
        triggerExtraProps.nativeID = id;
    }
    if (testID !== undefined) {
        triggerExtraProps.testID = testID;
    }
    if (hasError) {
        triggerExtraProps['aria-invalid'] = true;
    }
    if (ariaProps['aria-required']) {
        triggerExtraProps['aria-required'] = true;
    }
    if (disabled) {
        triggerExtraProps['aria-disabled'] = true;
    }

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <Popover.Trigger asChild={false} className={cn(className)}>
                <Pressable
                    onPress={disabled ? undefined : () => setOpen(!open)}
                    disabled={disabled}
                    className={cn(
                        'flex-row items-center rounded-md border px-3 py-2',
                        hasError ? 'border-semantic-interactive-destructive' : 'border-semantic-border-default',
                        disabled ? 'opacity-60' : undefined,
                        className
                    )}
                    style={pressableStyle}
                    {...(triggerExtraProps as Record<string, unknown>)}
                >
                    <RNText style={textStyle} numberOfLines={1}>
                        {displayValue ?? placeholder ?? ''}
                    </RNText>
                    <View style={{ marginLeft: px(colors.spacing['2']) }}>
                        <CalendarIcon size={16} color={colors.semantic.text.muted} />
                    </View>
                </Pressable>
            </Popover.Trigger>
            <Popover.Content aria-label="Date picker" side="bottom" align="start">
                <Calendar
                    mode="single"
                    value={current}
                    onChange={(date) => {
                        handleChange(date as CalendarDate | null);
                    }}
                    locale={locale}
                    {...calendarOptional}
                />
            </Popover.Content>
        </Popover>
    );
};

// ---------------------------------------------------------------------------
// DatePicker.Range
// ---------------------------------------------------------------------------

const DatePickerRange = ({
    value,
    defaultValue,
    onChange,
    locale: localeProp,
    minValue,
    maxValue,
    isDateUnavailable,
    firstDayOfWeek,
    placeholder,
    disabled = false,
    id,
    name: _name,
    className,
    testID,
    ...ariaProps
}: DatePickerRangeProps) => {
    const providerLocale = useLocale();
    const locale = localeProp ?? providerLocale;

    const [open, setOpen] = useState(false);

    const isControlled = value !== undefined;
    const [inner, setInner] = useState<DateRangeValue>(defaultValue ?? { start: null, end: null });
    const current = isControlled ? (value ?? { start: null, end: null }) : inner;

    const calendarValue: DateRange | null = current.start !== null ? { start: current.start, end: current.end } : null;

    const handleChange = useCallback(
        (calRange: DateRange | null) => {
            const next: DateRangeValue = {
                start: calRange?.start ?? null,
                end: calRange?.end ?? null,
            };
            if (!isControlled) {
                setInner(next);
            }
            onChange?.(next);
            if (next.start !== null && next.end !== null) {
                setOpen(false);
            }
        },
        [isControlled, onChange]
    );

    const handleOpenChange = useCallback(
        (next: boolean) => {
            if (!disabled) {
                setOpen(next);
            }
        },
        [disabled]
    );

    let displayValue: string | null = null;
    if (current.start !== null) {
        const startStr = formatDate(current.start, locale);
        const endStr = current.end !== null ? formatDate(current.end, locale) : '';
        displayValue = `${startStr} – ${endStr}`;
    }

    const calendarOptional = buildCalendarOptional(minValue, maxValue, isDateUnavailable, firstDayOfWeek);
    const triggerAriaProps = buildTriggerAriaProps(ariaProps);

    const colors = useThemeColors();
    const hasError = ariaProps['aria-invalid'] === true || (ariaProps['aria-invalid'] as unknown as string) === 'true';

    const pressableStyle = {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        borderWidth: 1,
        borderRadius: px(colors.radius.md),
        paddingHorizontal: px(colors.spacing['3']),
        paddingVertical: px(colors.spacing['2']),
        backgroundColor: colors.semantic.background.elevated,
        borderColor: hasError ? colors.color.danger : colors.semantic.border.default,
        opacity: disabled ? 0.6 : 1,
    };

    const textStyle = {
        flex: 1,
        fontFamily: colors.fontFamily.body,
        fontSize: px(colors.fontSize.md),
        color: displayValue ? colors.semantic.text.default : colors.semantic.text.muted,
    };

    const triggerExtraProps: Record<string, unknown> = {
        role: 'combobox',
        accessibilityRole: 'button',
        'aria-haspopup': 'dialog',
        'aria-expanded': open,
        ...triggerAriaProps,
    };
    if (id !== undefined) {
        triggerExtraProps.id = id;
        triggerExtraProps.nativeID = id;
    }
    if (testID !== undefined) {
        triggerExtraProps.testID = testID;
    }
    if (hasError) {
        triggerExtraProps['aria-invalid'] = true;
    }
    if (ariaProps['aria-required']) {
        triggerExtraProps['aria-required'] = true;
    }
    if (disabled) {
        triggerExtraProps['aria-disabled'] = true;
    }

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <Popover.Trigger asChild={false} className={cn(className)}>
                <Pressable
                    onPress={disabled ? undefined : () => setOpen(!open)}
                    disabled={disabled}
                    className={cn(
                        'flex-row items-center rounded-md border px-3 py-2',
                        hasError ? 'border-semantic-interactive-destructive' : 'border-semantic-border-default',
                        disabled ? 'opacity-60' : undefined,
                        className
                    )}
                    style={pressableStyle}
                    {...(triggerExtraProps as Record<string, unknown>)}
                >
                    <RNText style={textStyle} numberOfLines={1}>
                        {displayValue ?? placeholder ?? ''}
                    </RNText>
                    <View style={{ marginLeft: px(colors.spacing['2']) }}>
                        <CalendarIcon size={16} color={colors.semantic.text.muted} />
                    </View>
                </Pressable>
            </Popover.Trigger>
            <Popover.Content aria-label="Date range picker" side="bottom" align="start">
                <Calendar
                    mode="range"
                    value={calendarValue}
                    onChange={(range) => {
                        handleChange(range as DateRange | null);
                    }}
                    locale={locale}
                    {...calendarOptional}
                />
            </Popover.Content>
        </Popover>
    );
};

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

export const DatePicker = Object.assign(DatePickerRoot, {
    Range: DatePickerRange,
});
