'use client';

import { type ComponentType, createContext, type ReactNode, type Ref, useCallback, useContext, useState } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Pressable, Text as RNText, View } from 'react-native';
import { useTranslation } from '../../i18n/use-translation';
import type { IconComponentProps } from '../../icons/icon';
import { useSemanticIcon } from '../../icons/use-semantic-icon';
import type { Theme } from '../../theme/generated-tokens';
import { px } from '../../theme/px';
import { useColorScheme } from '../../theme/use-color-scheme';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';

export type ChipVariant = 'outline' | 'soft' | 'solid';
export type ChipSize = 'sm' | 'md';

type SizeTokens = {
    height: number; // component-density literal — not from theme
    removeWidth: number; // component-density literal — not from theme
    iconSize: number; // component-density literal — not from theme
    paddingHKey: keyof Theme['spacing'];
    fontKey: keyof Theme['fontSize'];
};

// Heights include the 1px border on each side, so the pressable area inside
// a `sm` chip is 26px tall and the remove button is 24px wide: both clear
// the WCAG 2.2 minimum target size of 24 by 24 CSS pixels.
const SIZE_TOKENS: Record<ChipSize, SizeTokens> = {
    sm: { height: 28, removeWidth: 24, iconSize: 12, paddingHKey: '2', fontKey: 'xs' },
    md: { height: 32, removeWidth: 28, iconSize: 14, paddingHKey: '3', fontKey: 'sm' },
};

type ChipGroupContextValue = {
    isSelected: (value: string) => boolean;
    toggle: (value: string) => void;
    disabled: boolean;
    variant: ChipVariant | undefined;
    size: ChipSize | undefined;
};

const ChipGroupContext = createContext<ChipGroupContextValue | null>(null);

export type ChipProps = {
    /**
     * Visible content of the chip. Falls back to `label` when omitted.
     */
    children?: ReactNode;
    /**
     * Text label. Rendered as the chip content when `children` is omitted.
     * When `children` is not plain text (an icon, an avatar), `label` becomes
     * the accessible name of the chip and is inserted into the remove
     * button's name ("Remove {{label}}").
     */
    label?: string;
    /**
     * Controlled selected state. Passing it makes the chip a toggle button
     * that exposes `aria-pressed`. Pair with `onSelectedChange`.
     */
    selected?: boolean;
    /**
     * Uncontrolled initial selected state. Passing it makes the chip a toggle
     * button. Ignored when `selected` is provided.
     */
    defaultSelected?: boolean;
    /** Fires with the next selected state when the user toggles the chip. */
    onSelectedChange?: (selected: boolean) => void;
    /**
     * Fires when the chip body is pressed. Passing it makes the chip a button
     * (an "action chip"). Also fires on toggleable chips, after the selection
     * change.
     */
    onPress?: () => void;
    /**
     * Fires when the trailing remove button is pressed. Passing it renders
     * that button as a separate focusable control next to the chip body.
     */
    onRemove?: () => void;
    /**
     * Leading icon component. Receives `size` and `color`. A selected chip
     * shows a checkmark in this position instead, so selection never depends
     * on color alone.
     */
    icon?: ComponentType<IconComponentProps>;
    /**
     * Visual treatment.
     *  - `outline`: border, transparent background.
     *  - `soft`: tinted background, no visible border.
     *  - `solid`: filled background, inverted text.
     * Inside a `Chip.Group` the group's `variant` is used unless the chip
     * sets its own.
     * @defaultValue 'outline'
     */
    variant?: ChipVariant;
    /**
     * Density. `sm` is 28px tall, `md` is 32px tall. Inside a `Chip.Group`
     * the group's `size` is used unless the chip sets its own.
     * @defaultValue 'md'
     */
    size?: ChipSize;
    /**
     * Blocks pressing, toggling, and removing, and dims the chip.
     * @defaultValue false
     */
    disabled?: boolean;
    /**
     * Identifier of this chip inside a `Chip.Group`. A chip with a `value`
     * inside a group takes its selected state from the group and ignores
     * `selected`, `defaultSelected`, and `onSelectedChange`.
     */
    value?: string;
    /** Extra class names for the outer pill. */
    className?: string;
    /** Extra styles for the outer pill, merged after the built-in styles. */
    style?: StyleProp<ViewStyle>;
    /**
     * Test identifier of the outer pill. The chip body button gets
     * `${testID}-button` and the remove button gets `${testID}-remove`.
     */
    testID?: string;
    /** Ref to the outer pill. */
    ref?: Ref<View>;
};

type ChipPalette = { bg: string; hoverBg: string; border: string; fg: string };

/**
 * Compact interactive pill for filters, selections, and removable tags.
 *
 * The chip adapts its semantics to the props it receives:
 *  - no `onPress`, selection props, or `onRemove`: static text, no role.
 *  - `onPress`: a button.
 *  - `selected` / `defaultSelected` / `onSelectedChange` (or a `value` inside
 *    a `Chip.Group`): a toggle button with `aria-pressed`.
 *  - `onRemove`: adds a second, separate button after the chip body.
 *
 * Use `Badge` instead for a status label that is never interactive.
 */
const ChipRoot = ({
    children,
    label,
    selected,
    defaultSelected,
    onSelectedChange,
    onPress,
    onRemove,
    icon: LeadingIcon,
    variant: variantProp,
    size: sizeProp,
    disabled: disabledProp = false,
    value,
    className,
    style,
    testID,
    ref,
}: ChipProps) => {
    const colors = useThemeColors();
    const isDark = useColorScheme() === 'dark';
    const { t } = useTranslation();
    const CheckIcon = useSemanticIcon('checkmark');
    const CloseIcon = useSemanticIcon('close');
    const group = useContext(ChipGroupContext);

    const variant = variantProp ?? group?.variant ?? 'outline';
    const size = sizeProp ?? group?.size ?? 'md';
    const disabled = disabledProp || Boolean(group?.disabled);
    const tokens = SIZE_TOKENS[size];

    const [inner, setInner] = useState<boolean>(defaultSelected ?? false);
    const groupValue = group !== null && value !== undefined ? value : undefined;
    const isToggleable =
        groupValue !== undefined ||
        selected !== undefined ||
        defaultSelected !== undefined ||
        onSelectedChange !== undefined;
    const isControlled = selected !== undefined;
    const isSelected =
        groupValue !== undefined && group !== null ? group.isSelected(groupValue) : isControlled ? selected : inner;
    const isInteractive = isToggleable || onPress !== undefined;

    const [hovered, setHovered] = useState(false);
    const handleHoverIn = useCallback(() => setHovered(true), []);
    const handleHoverOut = useCallback(() => setHovered(false), []);

    const handlePress = () => {
        if (disabled) {
            return;
        }
        if (groupValue !== undefined && group !== null) {
            group.toggle(groupValue);
        } else if (isToggleable) {
            const next = !isSelected;
            if (!isControlled) {
                setInner(next);
            }
            onSelectedChange?.(next);
        }
        onPress?.();
    };

    const handleRemove = () => {
        if (disabled) {
            return;
        }
        onRemove?.();
    };

    const invertedText = colors.semantic.text.inverted;
    // Same neutral / primary ramps Badge uses, so a chip next to a badge reads
    // as part of one family. The outline border is darker than Badge's because
    // on an interactive control it has to reach 3:1 against the page.
    const palette: ChipPalette = (() => {
        if (isSelected) {
            if (variant === 'solid') {
                const bg = isDark ? colors.color.primary['400'] : colors.color.primary['600'];
                return { bg, hoverBg: bg, border: bg, fg: isDark ? colors.color.primary['900'] : invertedText };
            }
            const bg = isDark ? colors.color.primary['900'] : colors.color.primary['100'];
            return {
                bg,
                hoverBg: bg,
                border: variant === 'outline' ? colors.semantic.interactive.primary : bg,
                fg: isDark ? colors.color.primary['200'] : colors.color.primary['800'],
            };
        }
        if (variant === 'solid') {
            const bg = isDark ? colors.color.neutral['200'] : colors.color.neutral['700'];
            return { bg, hoverBg: bg, border: bg, fg: isDark ? colors.color.neutral['900'] : invertedText };
        }
        if (variant === 'soft') {
            const bg = isDark ? colors.color.neutral['800'] : colors.color.neutral['100'];
            return {
                bg,
                hoverBg: colors.semantic.border.default,
                border: bg,
                fg: isDark ? colors.color.neutral['100'] : colors.color.neutral['700'],
            };
        }
        return {
            bg: 'transparent',
            hoverBg: colors.semantic.background.subtle,
            border: isDark ? colors.color.neutral['400'] : colors.color.neutral['500'],
            fg: colors.semantic.text.default,
        };
    })();

    const isHovered = hovered && isInteractive && !disabled;
    const paddingH = px(colors.spacing[tokens.paddingHKey]);
    const radius = px(colors.radius.full);

    const rootStyle: ViewStyle = {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'stretch',
        height: tokens.height,
        borderRadius: radius,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: isHovered ? palette.hoverBg : palette.bg,
        // Solid and selected surfaces have no lighter step in the palette,
        // so hover dims them slightly instead of swapping the color.
        opacity: disabled ? 0.5 : isHovered && palette.hoverBg === palette.bg ? 0.9 : 1,
    };
    const bodyStyle: ViewStyle = {
        flexDirection: 'row',
        alignItems: 'center',
        gap: px(colors.spacing['1']),
        paddingLeft: paddingH,
        paddingRight: onRemove ? px(colors.spacing['1']) : paddingH,
        borderRadius: radius,
    };
    const textStyle: TextStyle = {
        color: palette.fg,
        fontFamily: colors.fontFamily.body,
        fontSize: px(colors.fontSize[tokens.fontKey]),
        fontWeight: colors.fontWeight.medium as '500',
    };

    const plainText = typeof children === 'string' || typeof children === 'number' ? String(children) : undefined;
    const accessibleName = label ?? plainText;
    // Only override the name computed from the content when the content is
    // not text; otherwise the visible text and the name could drift apart.
    const explicitName = label !== undefined && children !== undefined && plainText === undefined ? label : undefined;

    const content = children ?? label;
    const body = (
        <>
            {isSelected ? (
                <CheckIcon size={tokens.iconSize} color={palette.fg} />
            ) : LeadingIcon ? (
                <LeadingIcon size={tokens.iconSize} color={palette.fg} />
            ) : null}
            {/* Only text goes inside Text: a nested View (an avatar, an
                icon) would be laid out inline on native. */}
            {isTextContent(content) ? <RNText style={textStyle}>{content}</RNText> : content}
        </>
    );

    const bodyProps: Record<string, unknown> = {
        ...(testID !== undefined ? { testID: `${testID}-button` } : {}),
        ...(explicitName !== undefined ? { 'aria-label': explicitName, accessibilityLabel: explicitName } : {}),
    };
    const removeLabel = t('chip.remove', { label: accessibleName ?? '' }).trim();

    return (
        <View
            ref={ref}
            {...(testID !== undefined ? { testID } : {})}
            className={cn('inline-flex flex-row items-stretch rounded-full border', className)}
            style={[rootStyle, style]}
        >
            {isInteractive ? (
                <Pressable
                    role="button"
                    accessibilityRole="button"
                    accessibilityState={{ disabled, ...(isToggleable ? { selected: isSelected } : {}) }}
                    disabled={disabled}
                    onPress={handlePress}
                    onHoverIn={handleHoverIn}
                    onHoverOut={handleHoverOut}
                    {...(isToggleable ? { 'aria-pressed': isSelected } : {})}
                    {...(disabled ? { 'aria-disabled': true } : {})}
                    {...bodyProps}
                    className="flex-row items-center select-none"
                    style={bodyStyle}
                >
                    {body}
                </Pressable>
            ) : (
                // A name on an element without a role is ignored by
                // browsers, so a named static chip is exposed as one image.
                <View
                    {...bodyProps}
                    {...(explicitName !== undefined ? { role: 'img' } : {})}
                    className="flex-row items-center"
                    style={bodyStyle}
                >
                    {body}
                </View>
            )}
            {onRemove ? (
                <Pressable
                    role="button"
                    accessibilityRole="button"
                    accessibilityLabel={removeLabel}
                    aria-label={removeLabel}
                    accessibilityState={{ disabled }}
                    disabled={disabled}
                    onPress={handleRemove}
                    {...(disabled ? { 'aria-disabled': true } : {})}
                    {...(testID !== undefined ? { testID: `${testID}-remove` } : {})}
                    className="items-center justify-center select-none"
                    style={{
                        width: tokens.removeWidth,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: radius,
                    }}
                >
                    <CloseIcon size={tokens.iconSize} color={palette.fg} />
                </Pressable>
            ) : null}
        </View>
    );
};

type ChipGroupCommonProps = {
    /**
     * Disables every chip in the group. A chip's own `disabled` is OR-ed
     * with this.
     * @defaultValue false
     */
    disabled?: boolean;
    /**
     * Visual treatment applied to every chip that does not set its own.
     * @defaultValue 'outline'
     */
    variant?: ChipVariant;
    /**
     * Density applied to every chip that does not set its own.
     * @defaultValue 'md'
     */
    size?: ChipSize;
    /** The chips. Each selectable chip needs a unique `value`. */
    children?: ReactNode;
    /** Extra class names for the group container. */
    className?: string;
    /** Test identifier of the group container. */
    testID?: string;
    /** Accessible name of the group on web, for example "Filter by topic". */
    'aria-label'?: string;
    /** Accessible name of the group on native. Falls back to `aria-label`. */
    accessibilityLabel?: string;
};

export type ChipGroupSingleProps = ChipGroupCommonProps & {
    /** `single` allows at most one selected chip; `multiple` allows any number. */
    type: 'single';
    // `| undefined` is intentional under exactOptionalPropertyTypes: pressing
    // the selected chip clears the selection, so a controlled consumer must
    // be able to pass `undefined`.
    /** Controlled selected value. Pair with `onChange`. */
    value?: string | undefined;
    /** Uncontrolled initial selected value. */
    defaultValue?: string | undefined;
    /** Fires with the selected value, or `undefined` when the selection is cleared. */
    onChange?: (next: string | undefined) => void;
};

export type ChipGroupMultipleProps = ChipGroupCommonProps & {
    /** `single` allows at most one selected chip; `multiple` allows any number. */
    type: 'multiple';
    /** Controlled selected values. Pair with `onChange`. */
    value?: string[] | undefined;
    /** Uncontrolled initial selected values. */
    defaultValue?: string[] | undefined;
    /** Fires with the full list of selected values after every toggle. */
    onChange?: (next: string[]) => void;
};

export type ChipGroupProps = ChipGroupSingleProps | ChipGroupMultipleProps;

const toList = (value: string | string[] | undefined): string[] => {
    if (value === undefined) {
        return [];
    }
    return typeof value === 'string' ? [value] : value;
};

const isTextContent = (node: ReactNode): boolean =>
    typeof node === 'string' ||
    typeof node === 'number' ||
    (Array.isArray(node) && node.every((item) => typeof item === 'string' || typeof item === 'number'));

/**
 * Wrapping row of chips with shared selection state.
 *
 * - `type="multiple"`: `value` is `string[]`. Pressing a chip adds it to or
 *   removes it from the array.
 * - `type="single"`: `value` is `string | undefined`. Pressing a chip selects
 *   it; pressing the selected chip clears the selection.
 *
 * Unlike `Toggle.Group`, every chip stays in the tab order. Chips wrap onto
 * several lines and can carry a second button (remove), so arrow-key roving
 * focus would have no single obvious direction or target.
 */
export const ChipGroup = (props: ChipGroupProps) => {
    const {
        disabled = false,
        variant,
        size,
        children,
        className,
        testID,
        'aria-label': ariaLabel,
        accessibilityLabel,
    } = props;
    const colors = useThemeColors();
    const [inner, setInner] = useState<string[]>(() => toList(props.defaultValue));
    const isControlled = props.value !== undefined;
    const current = isControlled ? toList(props.value) : inner;

    const toggle = (target: string) => {
        if (disabled) {
            return;
        }
        if (props.type === 'single') {
            const next = current.includes(target) ? undefined : target;
            // Mirrored even while controlled: clearing a single-select group
            // sets `value` to `undefined`, which reads as uncontrolled, and
            // the fallback must then be the cleared state rather than a stale
            // earlier selection.
            setInner(toList(next));
            props.onChange?.(next);
            return;
        }
        const next = current.includes(target) ? current.filter((v) => v !== target) : [...current, target];
        if (!isControlled) {
            setInner(next);
        }
        props.onChange?.(next);
    };

    // Rebuilt on every render on purpose: `toggle` closes over the current
    // selection and props, and a group re-render is cheap next to the bugs a
    // stale memoized closure would cause.
    const ctxValue: ChipGroupContextValue = {
        isSelected: (v) => current.includes(v),
        toggle,
        disabled,
        variant,
        size,
    };

    const label = ariaLabel ?? accessibilityLabel;
    const groupProps: Record<string, unknown> = {
        role: 'group',
        ...(label ? { 'aria-label': label, accessibilityLabel: label } : {}),
        ...(disabled ? { 'aria-disabled': true } : {}),
        ...(testID !== undefined ? { testID } : {}),
    };
    const gap = px(colors.spacing['2']);

    return (
        <ChipGroupContext.Provider value={ctxValue}>
            <View
                {...groupProps}
                className={cn('flex-row flex-wrap items-center gap-2', className)}
                style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap }}
            >
                {children}
            </View>
        </ChipGroupContext.Provider>
    );
};

/**
 * Public `Chip` value: the chip plus its `.Group` static member. Use
 * `<Chip.Group>` to wrap chips that share one selection.
 *
 * `Object.assign` produces a value whose inferred type carries the static
 * property, so `.d.ts` consumers can write `<Chip.Group>` without a separate
 * import.
 */
export const Chip = Object.assign(ChipRoot, {
    Group: ChipGroup,
});
