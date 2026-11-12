'use client';

import type { Ref } from 'react';
import { useMemo, useState } from 'react';
import type {
    KeyboardTypeOptions,
    NativeSyntheticEvent,
    TextInput as RNTextInput,
    StyleProp,
    TextInputKeyPressEventData,
    TextStyle,
    ViewStyle,
} from 'react-native';
import { Platform, Pressable, Text as RNText, View } from 'react-native';
import { useLocale } from '../../i18n/locale';
import { useTranslation } from '../../i18n/use-translation';
import type { Theme } from '../../theme/generated-tokens';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';
import { TextInput, type TextInputProps } from '../TextInput';

export type NumberInputSize = 'sm' | 'md' | 'lg';

export type NumberInputProps = {
    /**
     * Controlled value. `null` means the field is empty. Pair with
     * `onChange`. Leave undefined for uncontrolled usage.
     */
    value?: number | null;
    /**
     * Initial value for uncontrolled usage. `null` starts empty.
     * @defaultValue null
     */
    defaultValue?: number | null;
    /**
     * Called with the committed value: after blur, Enter, an arrow key, or a
     * stepper button. Receives `null` when the field was cleared. It is not
     * called on every keystroke, and not when the committed value is unchanged.
     */
    onChange?: (value: number | null) => void;
    /** Lowest allowed value. Committed values below it are clamped to it. No lower bound when omitted. */
    min?: number;
    /** Highest allowed value. Committed values above it are clamped to it. No upper bound when omitted. */
    max?: number;
    /**
     * Amount added or subtracted by the stepper buttons and the arrow keys.
     * Must be greater than 0.
     * @defaultValue 1
     */
    step?: number;
    /**
     * Number of decimal places. Committed values are rounded to it, and when
     * it is set explicitly the displayed value is padded to it (`1.5` shows as
     * `1.50` with `precision={2}`). Defaults to the decimal places of `step`
     * (`step={0.25}` gives `2`), without padding.
     */
    precision?: number;
    /**
     * Disables the field and both stepper buttons.
     * @defaultValue false
     */
    disabled?: boolean;
    /**
     * Field density: font size, vertical padding, and stepper button size
     * (24 / 28 / 32 px).
     * @defaultValue 'md'
     */
    size?: NumberInputSize;
    /** Text shown while the field is empty. */
    placeholder?: string;
    /**
     * Form field name. On web a hidden input submits the committed number
     * (always with `.` as the decimal separator, empty when there is no
     * value) with an enclosing HTML form.
     */
    name?: string;
    /** Element id of the input. Set automatically inside `<Field>`. */
    id?: string;
    /** Accessible name when there is no visible label. */
    'aria-label'?: string;
    /** Id of the element that labels the input. Set automatically inside `<Field>`. */
    'aria-labelledby'?: string;
    /** Ids of elements that describe the input (description, error). Set automatically inside `<Field>`. */
    'aria-describedby'?: string;
    /** Marks the value as invalid and switches the border to the danger color. Set automatically inside `<Field>`. */
    'aria-invalid'?: boolean;
    /** Marks the field as required for assistive technology. Set automatically inside `<Field>`. */
    'aria-required'?: boolean;
    /** Called when the input receives focus. */
    onFocus?: TextInputProps['onFocus'];
    /** Called when the input loses focus, after the typed text was committed. */
    onBlur?: TextInputProps['onBlur'];
    /** Tailwind / NativeWind classes merged onto the input element. */
    className?: string;
    /** Tailwind / NativeWind classes for the outer wrapper around the bordered field. */
    containerClassName?: string;
    /** Style override for the input text, merged after the themed style. */
    style?: StyleProp<TextStyle>;
    /** Test identifier of the input. The stepper buttons are found by their accessible names. */
    testID?: string;
    /** Ref to the underlying text input, for `focus()` / `blur()`. */
    ref?: Ref<RNTextInput>;
};

// ─── Number helpers ───────────────────────────────────────────────────────

/** Decimal places of a number, including exponent notation (`1e-7` → 7). */
const countDecimals = (value: number): number => {
    const [mantissa = '', exponent] = String(value).split('e');
    const mantissaDecimals = mantissa.split('.')[1]?.length ?? 0;
    return Math.max(0, mantissaDecimals - Number(exponent ?? 0));
};

/**
 * Round to `precision` decimal places by shifting the decimal point in the
 * string form. `Math.round(value * 10 ** precision)` would inherit binary
 * float error (1.005 * 100 = 100.49999…); the exponent form does not.
 */
const roundTo = (value: number, precision: number): number => {
    const shifted = Number(`${Math.abs(value)}e${precision}`);
    if (!Number.isFinite(shifted)) {
        // `String(value)` was already in exponent notation (very large or
        // very small), so the decimal point cannot be shifted textually.
        return Number(value.toFixed(Math.min(precision, 100))) || 0;
    }
    const rounded = Number(`${Math.round(shifted)}e-${precision}`);
    // `|| 0` folds -0 into 0 so consumers never see a negative zero.
    return Math.sign(value) * rounded || 0;
};

const clamp = (value: number, min: number | undefined, max: number | undefined): number => {
    let next = value;
    if (max !== undefined && next > max) {
        next = max;
    }
    // `min` wins when the bounds contradict each other.
    if (min !== undefined && next < min) {
        next = min;
    }
    return next;
};

/**
 * The decimal separator typed and shown for a locale. Only `.` and `,` are
 * supported; any other locale convention falls back to `.`.
 */
const getDecimalSeparator = (locale: string): '.' | ',' => {
    try {
        const part = new Intl.NumberFormat(locale).formatToParts(1.1).find((entry) => entry.type === 'decimal');
        return part?.value === ',' ? ',' : '.';
    } catch {
        return '.';
    }
};

/**
 * Parse free-form text. Returns the number, `null` for an empty field, or
 * `undefined` when the text is not a number.
 *
 * `.` is always accepted as the decimal separator. In comma locales a `,` is
 * the decimal separator and any `.` next to it is read as a grouping mark
 * (`1.234,5` → 1234.5).
 */
const parseText = (text: string, decimalSeparator: '.' | ','): number | null | undefined => {
    let normalized = text.replace(/\s/g, '').replace(/−/g, '-');
    if (normalized === '') {
        return null;
    }
    if (decimalSeparator === ',' && normalized.includes(',')) {
        normalized = normalized.split('.').join('').replace(',', '.');
    }
    if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(normalized)) {
        return undefined;
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
};

// ─── Stepper button ───────────────────────────────────────────────────────

const BUTTON_SIZE: Record<NumberInputSize, number> = { sm: 24, md: 28, lg: 32 };

type SizeKeys = { font: keyof Theme['fontSize']; padY: keyof Theme['spacing'] };
const SIZE_KEYS: Record<NumberInputSize, SizeKeys> = {
    sm: { font: 'sm', padY: '1' },
    md: { font: 'md', padY: '2' },
    lg: { font: 'lg', padY: '3' },
};

type StepButtonProps = {
    label: string;
    glyph: string;
    size: NumberInputSize;
    disabled: boolean;
    onPress: () => void;
};

const StepButton = ({ label, glyph, size, disabled, onPress }: StepButtonProps) => {
    const colors = useThemeColors();
    const [hovered, setHovered] = useState(false);
    const [pressed, setPressed] = useState(false);
    const dimension = BUTTON_SIZE[size];

    const style: ViewStyle = {
        width: dimension,
        height: dimension,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: px(colors.radius.sm),
        backgroundColor: disabled
            ? 'transparent'
            : pressed
              ? colors.semantic.border.default
              : hovered
                ? colors.semantic.background.subtle
                : 'transparent',
        opacity: disabled ? 0.4 : 1,
    };

    const webProps: Record<string, unknown> =
        Platform.OS === 'web'
            ? {
                  // Spinbutton pattern: the field is the single tab stop and
                  // the arrow keys step it, so the buttons stay out of the tab
                  // order. They remain reachable by pointer and screen reader.
                  tabIndex: -1,
                  // Keeps focus (and the caret) in the input while stepping.
                  onMouseDown: (event: { preventDefault?: () => void }) => event.preventDefault?.(),
              }
            : {};

    return (
        <Pressable
            role="button"
            accessibilityRole="button"
            aria-label={label}
            accessibilityLabel={label}
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={onPress}
            onPressIn={() => setPressed(true)}
            onPressOut={() => setPressed(false)}
            onHoverIn={() => setHovered(true)}
            onHoverOut={() => setHovered(false)}
            hitSlop={6}
            style={style}
            {...webProps}
        >
            <RNText
                aria-hidden
                style={{
                    color: colors.semantic.text.default,
                    fontFamily: colors.fontFamily.body,
                    fontSize: px(colors.fontSize[SIZE_KEYS[size].font]),
                    lineHeight: dimension,
                }}
            >
                {glyph}
            </RNText>
        </Pressable>
    );
};

// ─── NumberInput ──────────────────────────────────────────────────────────

/**
 * Numeric field with decrement and increment buttons.
 *
 * Typing is free-form. The text is committed — parsed, clamped to
 * `min` / `max`, rounded to `precision` — on blur and on Enter; text that is
 * not a number is discarded and the previous value is restored. The stepper
 * buttons and (on web) the ArrowUp / ArrowDown keys change the value by
 * `step` without floating-point artifacts.
 *
 * ```tsx
 * const [quantity, setQuantity] = useState<number | null>(1);
 * <NumberInput value={quantity} onChange={setQuantity} min={1} max={10} />
 * ```
 */
export const NumberInput = ({
    value: valueProp,
    defaultValue = null,
    onChange,
    min,
    max,
    step: stepProp = 1,
    precision: precisionProp,
    disabled = false,
    size = 'md',
    placeholder,
    name,
    id,
    onFocus,
    onBlur,
    className,
    containerClassName,
    style,
    testID,
    ref,
    // Holds the `aria-*` props plus whatever `<Field.Control>` injects that is
    // not declared above (`accessibilityLabelledBy`, …); all of it belongs on
    // the input.
    ...rest
}: NumberInputProps) => {
    const colors = useThemeColors();
    const { t } = useTranslation();
    const locale = useLocale();
    const decimalSeparator = useMemo(() => getDecimalSeparator(locale), [locale]);

    const isControlled = valueProp !== undefined;
    const [internalValue, setInternalValue] = useState<number | null>(defaultValue);
    const value = isControlled ? valueProp : internalValue;

    // The text being typed. `null` means "not editing": show the formatted
    // value. Keeping the draft separate lets intermediate text such as "-" or
    // "1." exist without being a valid number.
    const [draft, setDraft] = useState<string | null>(null);

    // A controlled value that changes while text is being typed wins over the
    // unfinished draft; otherwise the next blur would commit the stale text
    // over the parent's update.
    const [lastValueProp, setLastValueProp] = useState(valueProp);
    if (lastValueProp !== valueProp) {
        setLastValueProp(valueProp);
        setDraft(null);
    }

    const step = stepProp > 0 ? stepProp : 1;
    const precision = Math.max(0, Math.floor(precisionProp ?? countDecimals(step)));

    const format = (next: number | null): string => {
        if (next === null) {
            return '';
        }
        const text = precisionProp === undefined ? String(next) : next.toFixed(precision);
        return decimalSeparator === ',' ? text.replace('.', ',') : text;
    };

    const normalize = (next: number): number => roundTo(clamp(next, min, max), precision);

    const commitValue = (next: number | null) => {
        setDraft(null);
        if (!isControlled) {
            setInternalValue(next);
        }
        if (next !== value) {
            onChange?.(next);
        }
    };

    const commitDraft = () => {
        if (draft === null) {
            return;
        }
        const parsed = parseText(draft, decimalSeparator);
        if (parsed === undefined) {
            // Not a number: drop the text and fall back to the last value.
            setDraft(null);
            return;
        }
        commitValue(parsed === null ? null : normalize(parsed));
    };

    const stepBy = (direction: 1 | -1) => {
        if (disabled) {
            return;
        }
        // Step from what the user sees: pending text first, then the value.
        // An empty field steps from 0.
        const pending = draft === null ? undefined : parseText(draft, decimalSeparator);
        const base = (pending === undefined ? value : pending) ?? 0;
        // `normalize` rounds to `precision`, which also removes binary float
        // error from the addition (0.1 + 0.2 → 0.3).
        commitValue(normalize(base + direction * step));
    };

    const handleKeyPress = (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
        const key = event.nativeEvent.key;
        if (key === 'ArrowUp' || key === 'ArrowDown') {
            // Stops the browser from moving the caret to the start / end.
            event.preventDefault();
            stepBy(key === 'ArrowUp' ? 1 : -1);
        }
    };

    const allowsNegative = min === undefined || min < 0;
    // The iOS number and decimal pads have no minus key, so fields that accept
    // negative numbers need a keyboard that does.
    const keyboardType: KeyboardTypeOptions = allowsNegative
        ? Platform.select<KeyboardTypeOptions>({
              ios: 'numbers-and-punctuation',
              android: 'numeric',
              default: 'default',
          })
        : precision > 0
          ? 'decimal-pad'
          : 'number-pad';

    const atMin = value !== null && min !== undefined && value <= min;
    const atMax = value !== null && max !== undefined && value >= max;

    const sizeKeys = SIZE_KEYS[size];
    const inputStyle: TextStyle = {
        fontSize: px(colors.fontSize[sizeKeys.font]),
        paddingVertical: px(colors.spacing[sizeKeys.padY]),
        // Digits of equal width, so the value does not shift while stepping.
        fontVariant: ['tabular-nums'],
    };

    // Web only. On native the role would replace the text-field trait, and
    // VoiceOver / TalkBack would stop offering text editing.
    const spinbuttonProps: Record<string, unknown> =
        Platform.OS === 'web'
            ? {
                  role: 'spinbutton',
                  ...(value !== null ? { 'aria-valuenow': value } : {}),
                  ...(min !== undefined ? { 'aria-valuemin': min } : {}),
                  ...(max !== undefined ? { 'aria-valuemax': max } : {}),
              }
            : {};

    const steppers = (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: px(colors.spacing['1']) }}>
            <StepButton
                label={t('numberInput.decrement')}
                glyph="−"
                size={size}
                disabled={disabled || atMin}
                onPress={() => stepBy(-1)}
            />
            <StepButton
                label={t('numberInput.increment')}
                glyph="+"
                size={size}
                disabled={disabled || atMax}
                onPress={() => stepBy(1)}
            />
        </View>
    );

    // The visible field holds locale-formatted, possibly unfinished text, so
    // it must not be the form control. A hidden input carries the committed
    // number instead. Native has no HTML forms (and no <input> host).
    const formInput =
        Platform.OS === 'web' && name !== undefined && !disabled ? (
            <input type="hidden" name={name} value={value === null ? '' : String(value)} />
        ) : null;

    return (
        <>
            <TextInput
                {...rest}
                {...spinbuttonProps}
                {...(ref !== undefined ? { ref } : {})}
                {...(id !== undefined ? { id } : {})}
                {...(testID !== undefined ? { testID } : {})}
                {...(placeholder !== undefined ? { placeholder } : {})}
                {...(className !== undefined ? { className } : {})}
                {...(containerClassName !== undefined ? { containerClassName } : {})}
                {...(onFocus !== undefined ? { onFocus } : {})}
                disabled={disabled}
                value={draft ?? format(value)}
                onChangeText={setDraft}
                onBlur={(event) => {
                    commitDraft();
                    onBlur?.(event);
                }}
                // Enter commits but keeps focus, so the user can keep adjusting.
                onSubmitEditing={commitDraft}
                blurOnSubmit={false}
                submitBehavior="submit"
                onKeyPress={handleKeyPress}
                keyboardType={keyboardType}
                autoCapitalize="none"
                autoCorrect={false}
                style={[inputStyle, style]}
                trailing={steppers}
            />
            {formInput}
        </>
    );
};
