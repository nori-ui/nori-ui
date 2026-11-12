'use client';

import { type ComponentType, type KeyboardEvent, type Ref, useCallback, useRef, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Platform, Pressable, Text as RNText, View } from 'react-native';
import { useTranslation } from '../../i18n/use-translation';
import type { IconComponentProps } from '../../icons/icon';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';

export type RatingSize = 'sm' | 'md' | 'lg';

type RatingIcon = ComponentType<IconComponentProps>;

type SizeTokens = {
    star: number; // component-density literal — not from theme
    slot: number; // component-density literal — not from theme
};

// `slot` is the pressable box around one star. It never goes below 24px,
// the WCAG 2.2 minimum target size.
const SIZE_TOKENS: Record<RatingSize, SizeTokens> = {
    sm: { star: 20, slot: 24 },
    md: { star: 24, slot: 32 },
    lg: { star: 32, slot: 40 },
};

// With `allowHalf` every star hosts two targets side by side, so the slot
// widens until each half is a full 24px target of its own.
const MIN_TARGET = 24;

const isWeb = Platform.OS === 'web';

const STAR_PATH = 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';

// Same recipe as `icons/default-semantic-icons.tsx`: an inline SVG on web, a
// Unicode glyph in `<Text>` on native, so the library needs no SVG peer
// dependency. The two shapes (filled vs. outlined) keep "selected" readable
// without relying on color.
const makeStar = (filled: boolean): RatingIcon =>
    function StarIcon({ size = 24, color = 'currentColor' }) {
        const colors = useThemeColors();
        if (isWeb) {
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill={filled ? color : 'none'}
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <path d={STAR_PATH} />
                </svg>
            );
        }
        const resolvedColor = color === 'currentColor' ? colors.semantic.text.default : color;
        return (
            <RNText
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={{ fontSize: size, lineHeight: size, color: resolvedColor }}
            >
                {filled ? '★' : '☆'}
            </RNText>
        );
    };

const FilledStar = makeStar(true);
const EmptyStar = makeStar(false);

export type RatingProps = {
    /** Controlled rating, from `0` (no rating) to `max`. Pair with `onChange`. */
    value?: number;
    /**
     * Uncontrolled initial rating. Ignored when `value` is provided.
     * @defaultValue 0
     */
    defaultValue?: number;
    /** Fires with the new rating when the user picks one. Fires with `0` when the rating is cleared. */
    onChange?: (value: number) => void;
    /**
     * Number of stars.
     * @defaultValue 5
     */
    max?: number;
    /**
     * Lets the user pick half stars (0.5, 1, 1.5, ...). Each star then hosts
     * two targets, and the star spacing widens so each stays at least 24px.
     * @defaultValue false
     */
    allowHalf?: boolean;
    /**
     * Display mode. Renders one non-interactive element with `role="img"`
     * whose accessible name is the rating ("4 out of 5 stars"). Fractional
     * values such as `4.3` are drawn precisely.
     * @defaultValue false
     */
    readOnly?: boolean;
    /**
     * Blocks interaction and dims the stars.
     * @defaultValue false
     */
    disabled?: boolean;
    /**
     * Star size. `sm` is 20px, `md` is 24px, `lg` is 32px. Press targets are
     * always at least 24px.
     * @defaultValue 'md'
     */
    size?: RatingSize;
    /**
     * When true, pressing the currently selected rating again clears it to `0`.
     * @defaultValue false
     */
    allowClear?: boolean;
    /**
     * Icon component for the filled part of the scale. Receives `size` and
     * `color`.
     * @defaultValue a filled star
     */
    icon?: RatingIcon;
    /**
     * Icon component for the empty part of the scale. Receives `size` and
     * `color`.
     * @defaultValue an outlined star, or `icon` in a muted color when `icon` is set
     */
    emptyIcon?: RatingIcon;
    /**
     * Color of the filled icons.
     * @defaultValue the theme's `semantic.interactive.primary`
     */
    color?: string;
    /**
     * Form field name. On web a hidden input with this name carries the
     * value into an enclosing HTML form. Nothing is submitted while disabled.
     */
    name?: string;
    /**
     * Reading direction. `rtl` mirrors the stars and swaps the ArrowLeft /
     * ArrowRight keys.
     * @defaultValue 'ltr'
     */
    dir?: 'ltr' | 'rtl';
    /**
     * Accessible name of the control. In `readOnly` mode it replaces the
     * generated "4 out of 5 stars" name.
     * @defaultValue the translated `rating.ariaLabel` ("Rating") when no `aria-labelledby` is given
     */
    'aria-label'?: string;
    /**
     * Accessible name on native. `Field.Control` sets it on iOS, where
     * `aria-labelledby` has no effect.
     */
    accessibilityLabel?: string;
    /** HTML id forwarded to the root element. Injected by `Field.Control`. */
    id?: string;
    /** React Native equivalent of `id`. */
    nativeID?: string;
    /** Points to the element that labels this control. Injected by `Field.Control`. */
    'aria-labelledby'?: string;
    /** React Native equivalent of `aria-labelledby`. Injected by `Field.Control`. */
    accessibilityLabelledBy?: string;
    /** Points to description / error elements. Injected by `Field.Control`. */
    'aria-describedby'?: string;
    /** React Native equivalent of `aria-describedby`. Injected by `Field.Control`. */
    accessibilityDescribedBy?: string;
    /** Marks the control as invalid. Injected by `Field.Control` when the field has an error. */
    'aria-invalid'?: boolean;
    /** Marks the control as required. Injected by `Field.Control` when the field is required. */
    'aria-required'?: boolean;
    /** Extra class names for the root element. */
    className?: string;
    /** Extra styles for the root element, merged after the built-in styles. */
    style?: StyleProp<ViewStyle>;
    /**
     * Test identifier of the root element. In interactive mode each option
     * gets `${testID}-option-${value}`, for example `rating-option-3`.
     */
    testID?: string;
    /** Ref to the root element. */
    ref?: Ref<View>;
};

const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n));

/**
 * Star rating, as an input or as a read-only display.
 *
 * Interactive mode is a `role="radiogroup"` with one `role="radio"` per
 * selectable value, not a `role="slider"`. Reasons:
 *  - Every value is its own named control ("3 stars"), so a screen reader
 *    user on a touch device activates it directly. Custom ARIA sliders
 *    cannot be adjusted reliably with VoiceOver or TalkBack in mobile
 *    browsers, and this library targets mobile web as well as native.
 *  - It matches the WAI-ARIA Authoring Practices "Rating Radio Group"
 *    example and reuses the keyboard model of this library's `Radio.Group`.
 *  - Half steps only double the number of radios; the model stays the same.
 *
 * Keyboard (web): Tab lands on the selected option (or the first one when
 * nothing is selected). ArrowRight / ArrowDown select the next value,
 * ArrowLeft / ArrowUp the previous one, wrapping at the ends. Home / End
 * select the first / last value. Space selects the focused option, or
 * clears it when `allowClear` is set and it is already selected. With
 * `dir="rtl"` ArrowLeft and ArrowRight swap.
 */
export const Rating = ({
    value,
    defaultValue = 0,
    onChange,
    max = 5,
    allowHalf = false,
    readOnly = false,
    disabled = false,
    size = 'md',
    allowClear = false,
    icon,
    emptyIcon,
    color,
    name,
    dir = 'ltr',
    'aria-label': ariaLabel,
    accessibilityLabel,
    id,
    nativeID,
    'aria-labelledby': ariaLabelledBy,
    accessibilityLabelledBy,
    'aria-describedby': ariaDescribedBy,
    accessibilityDescribedBy,
    'aria-invalid': ariaInvalid,
    'aria-required': ariaRequired,
    className,
    style,
    testID,
    ref,
}: RatingProps) => {
    const colors = useThemeColors();
    const { t } = useTranslation();
    const [inner, setInner] = useState<number>(defaultValue);
    const isControlled = value !== undefined;
    const starCount = Math.max(1, Math.floor(max));
    const current = clamp(isControlled ? value : inner, 0, starCount);

    const step = allowHalf ? 0.5 : 1;
    const options: number[] = [];
    for (let option = step; option <= starCount; option += step) {
        options.push(option);
    }

    const optionRefs = useRef<Map<number, { focus?: () => void } | null>>(new Map());

    const select = useCallback(
        (next: number) => {
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

    const press = (option: number) => {
        const next = allowClear && option === current ? 0 : option;
        // Pressing the value that is already selected is not a change.
        if (next !== current) {
            select(next);
        }
    };

    const moveTo = (option: number | undefined) => {
        if (option === undefined) {
            return;
        }
        if (option !== current) {
            select(option);
        }
        optionRefs.current.get(option)?.focus?.();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLElement>, option: number) => {
        const index = options.indexOf(option);
        const count = options.length;
        const isRtl = dir === 'rtl';
        // Selection follows focus, like the library's Radio.Group. From an
        // unselected group the tab stop is the first option, so "next" must
        // select that one instead of skipping it. When focus sits elsewhere
        // without a selection (the value was just cleared, or it is not one
        // of the options), move relative to the focused option.
        const moveFromFocus = options.includes(current) || index > 0;
        const next = moveFromFocus ? options[(index + 1) % count] : options[0];
        const previous = moveFromFocus ? options[(index - 1 + count) % count] : options[count - 1];
        switch (event.key) {
            case 'ArrowDown': {
                event.preventDefault();
                moveTo(next);
                return;
            }
            case 'ArrowUp': {
                event.preventDefault();
                moveTo(previous);
                return;
            }
            case 'ArrowRight': {
                event.preventDefault();
                moveTo(isRtl ? previous : next);
                return;
            }
            case 'ArrowLeft': {
                event.preventDefault();
                moveTo(isRtl ? next : previous);
                return;
            }
            case 'Home': {
                event.preventDefault();
                moveTo(options[0]);
                return;
            }
            case 'End': {
                event.preventDefault();
                moveTo(options[count - 1]);
                return;
            }
            // Enter is left to react-native-web's Pressable, which already
            // turns it into a press; handling it here too would toggle twice.
            case ' ': {
                event.preventDefault();
                press(option);
                return;
            }
        }
    };

    const tokens = SIZE_TOKENS[size];
    const slotWidth = allowHalf && !readOnly ? Math.max(tokens.slot, MIN_TARGET * 2) : tokens.slot;
    const slotHeight = Math.max(tokens.slot, MIN_TARGET);
    const fillColor = color ?? colors.semantic.interactive.primary;
    // The muted text token clears 3:1 against the page in both schemes, the
    // minimum for a graphic that conveys state.
    const emptyColor = colors.semantic.text.muted;
    const Filled = icon ?? FilledStar;
    const Empty = emptyIcon ?? icon ?? EmptyStar;
    // Physical edge where the scale starts; the fill grows away from it.
    const startEdge = dir === 'rtl' ? 'right' : 'left';

    const valueLabel = t('rating.valueLabel', { value: current, max: starCount });
    const tabStop = options.includes(current) ? current : options[0];

    const stars = Array.from({ length: starCount }, (_unused, i) => {
        const starNumber = i + 1;
        const fill = clamp(current - i, 0, 1);
        const starOptions = options.filter((option) => option > i && option <= starNumber);
        return (
            <View
                key={starNumber}
                style={{ width: slotWidth, height: slotHeight, alignItems: 'center', justifyContent: 'center' }}
            >
                <View style={{ width: tokens.star, height: tokens.star }}>
                    <Empty size={tokens.star} color={emptyColor} />
                    {fill > 0 ? (
                        <View
                            style={{
                                position: 'absolute',
                                top: 0,
                                [startEdge]: 0,
                                width: tokens.star * fill,
                                height: tokens.star,
                                overflow: 'hidden',
                            }}
                        >
                            {/* Pinned to the start edge at full width so the
                             * clip above cuts the icon instead of squeezing it. */}
                            <View style={{ position: 'absolute', top: 0, [startEdge]: 0, width: tokens.star }}>
                                <Filled size={tokens.star} color={fillColor} />
                            </View>
                        </View>
                    ) : null}
                </View>
                {readOnly
                    ? null
                    : starOptions.map((option, optionIndex) => {
                          const checked = option === current;
                          const label = t('rating.starLabel', { count: option });
                          const width = slotWidth / starOptions.length;
                          const optionProps: Record<string, unknown> = {
                              role: 'radio',
                              accessibilityRole: 'radio',
                              'aria-checked': checked,
                              accessibilityState: { checked, disabled },
                              'aria-label': label,
                              accessibilityLabel: label,
                              tabIndex: option === tabStop && !disabled ? 0 : -1,
                              onKeyDown: (event: KeyboardEvent<HTMLElement>) => handleKeyDown(event, option),
                              ...(disabled ? { 'aria-disabled': true } : {}),
                              ...(testID !== undefined ? { testID: `${testID}-option-${option}` } : {}),
                          };
                          return (
                              <Pressable
                                  key={option}
                                  ref={(node: unknown) => {
                                      optionRefs.current.set(option, node as { focus?: () => void } | null);
                                  }}
                                  disabled={disabled}
                                  onPress={() => press(option)}
                                  {...optionProps}
                                  style={{
                                      position: 'absolute',
                                      top: 0,
                                      [startEdge]: width * optionIndex,
                                      width,
                                      height: slotHeight,
                                      borderRadius: px(colors.radius.sm),
                                  }}
                              />
                          );
                      })}
            </View>
        );
    });

    const rowStyle: ViewStyle = {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        direction: dir,
        ...(disabled ? { opacity: 0.5 } : null),
    };
    const sharedProps: Record<string, unknown> = {
        ...(testID !== undefined ? { testID } : {}),
        ...(id !== undefined ? { id } : {}),
        ...(nativeID !== undefined ? { nativeID } : {}),
        ...(ariaLabelledBy !== undefined ? { 'aria-labelledby': ariaLabelledBy } : {}),
        ...(accessibilityLabelledBy !== undefined ? { accessibilityLabelledBy } : {}),
        ...(ariaDescribedBy !== undefined ? { 'aria-describedby': ariaDescribedBy } : {}),
        ...(accessibilityDescribedBy !== undefined ? { accessibilityDescribedBy } : {}),
    };

    if (readOnly) {
        const label = ariaLabel ?? valueLabel;
        return (
            <View
                ref={ref}
                role="img"
                accessibilityRole="image"
                aria-label={label}
                accessibilityLabel={label}
                {...(isWeb ? {} : { accessible: true })}
                {...sharedProps}
                className={cn('flex-row items-center', className)}
                style={[rowStyle, style]}
            >
                {stars}
            </View>
        );
    }

    // A label passed by the consumer or by Field wins; the translated
    // fallback only exists so the group is never unnamed.
    const groupLabel =
        ariaLabel ?? accessibilityLabel ?? (ariaLabelledBy === undefined ? t('rating.ariaLabel') : undefined);
    const groupProps: Record<string, unknown> = {
        role: 'radiogroup',
        accessibilityRole: 'radiogroup',
        ...(groupLabel !== undefined ? { 'aria-label': groupLabel, accessibilityLabel: groupLabel } : {}),
        ...(disabled ? { 'aria-disabled': true } : {}),
        ...(ariaInvalid ? { 'aria-invalid': true } : {}),
        ...(ariaRequired ? { 'aria-required': true } : {}),
        ...sharedProps,
    };

    return (
        <View ref={ref} {...groupProps} className={cn('flex-row items-center', className)} style={[rowStyle, style]}>
            {stars}
            {/* react-native-web drops `name`, so on web a hidden input
             * carries the value into an enclosing HTML form. */}
            {isWeb && name !== undefined && !disabled ? <input type="hidden" name={name} value={current} /> : null}
        </View>
    );
};
