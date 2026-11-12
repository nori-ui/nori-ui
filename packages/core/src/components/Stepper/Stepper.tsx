'use client';

import {
    Children,
    createContext,
    isValidElement,
    type ReactElement,
    type ReactNode,
    type Ref,
    useContext,
} from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Platform, Pressable, Text as RNText, View } from 'react-native';
import { useTranslation } from '../../i18n/use-translation';
import { useSemanticIcon } from '../../icons/use-semantic-icon';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';

export type StepperOrientation = 'horizontal' | 'vertical';
export type StepperStepStatus = 'complete' | 'current' | 'upcoming' | 'error';

// Indicator diameter and connector thickness are component-density
// literals — not from theme — because the numbered circle has a fixed
// visual ramp independent of the spacing scale.
const INDICATOR_SIZE = 28;
const CONNECTOR_THICKNESS = 2;
const INDICATOR_ICON_SIZE = 14;

const isWeb = Platform.OS === 'web';

// Each platform only understands its own "hide this subtree" props, and
// react-native-web warns about the native ones.
const HIDDEN_FROM_ASSISTIVE_TECH: Record<string, unknown> = isWeb
    ? { 'aria-hidden': true }
    : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' };

type StepperContextValue = {
    orientation: StepperOrientation;
    onStepPress: ((index: number) => void) | undefined;
    total: number;
};

type StepPositionValue = {
    index: number;
    /** Status derived from the step's index versus the stepper's `value`. */
    status: StepperStepStatus;
    /** Whether the segment leading into this step is finished. */
    previousComplete: boolean;
};

const StepperContext = createContext<StepperContextValue | null>(null);
const StepPositionContext = createContext<StepPositionValue | null>(null);

export type StepperProps = {
    /**
     * Zero-based index of the current step. Steps before it are `complete`,
     * steps after it are `upcoming`. Pass the number of steps (or more) to
     * mark every step complete.
     */
    value: number;
    /**
     * Layout direction. `horizontal` places steps side by side with the
     * labels under the indicators. `vertical` stacks steps with the labels
     * beside the indicators, which fits narrow phone screens.
     * @defaultValue 'horizontal'
     */
    orientation?: StepperOrientation;
    /**
     * Fires with the zero-based index of a pressed step. Passing it turns
     * every `complete` step into a button, for navigating back. Current,
     * upcoming, and error steps are never pressable.
     */
    onStepPress?: (index: number) => void;
    /** The steps. Each direct child must be a `Stepper.Step`. */
    children?: ReactNode;
    /**
     * Accessible name of the list on web.
     * @defaultValue the translated `stepper.ariaLabel` ("Progress")
     */
    'aria-label'?: string;
    /** Accessible name of the list on native. Falls back to `aria-label`. */
    accessibilityLabel?: string;
    /** Extra class names for the list container. */
    className?: string;
    /** Extra styles for the list container, merged after the built-in styles. */
    style?: StyleProp<ViewStyle>;
    /** Test identifier of the list container. */
    testID?: string;
    /** Ref to the list container. */
    ref?: Ref<View>;
};

export type StepperStepProps = {
    /** Step name. Shown next to the indicator and used in the accessible name. */
    title: string;
    /** Optional secondary line under the title. */
    description?: ReactNode;
    /**
     * Overrides the status derived from the step's position. Use `error` to
     * flag a step that needs attention; it renders a warning icon and
     * danger-colored text, so the state never depends on color alone.
     * @defaultValue derived: `complete` before `value`, `current` at `value`, `upcoming` after
     */
    status?: StepperStepStatus;
    /** Extra class names for the step's list item. */
    className?: string;
    /** Test identifier of the step's list item. A pressable step's button gets `${testID}-button`. */
    testID?: string;
};

const readStatus = (child: ReactElement, index: number, value: number): StepperStepStatus => {
    const override = (child.props as { status?: StepperStepStatus }).status;
    if (override !== undefined) {
        return override;
    }
    if (index < value) {
        return 'complete';
    }
    return index === value ? 'current' : 'upcoming';
};

/**
 * Progress indicator for multi-step flows such as checkout or onboarding.
 * Not a number input.
 *
 *   <Stepper value={1}>
 *     <Stepper.Step title="Cart" />
 *     <Stepper.Step title="Shipping" description="Address and method" />
 *     <Stepper.Step title="Payment" />
 *   </Stepper>
 *
 * Renders an ordered list (`role="list"` with one `listitem` per step). The
 * current step carries `aria-current="step"`, and every step's accessible
 * name spells out position and status ("Step 2 of 3: Shipping, current").
 */
const StepperRoot = ({
    value,
    orientation = 'horizontal',
    onStepPress,
    children,
    'aria-label': ariaLabel,
    accessibilityLabel,
    className,
    style,
    testID,
    ref,
}: StepperProps) => {
    const { t } = useTranslation();
    // Position comes from child order, so only direct element children count.
    // Registering through effects instead would render the wrong numbers on
    // the server and on the first client paint.
    const steps = Children.toArray(children).filter(isValidElement);
    const statuses = steps.map((child, index) => readStatus(child, index, value));
    const label = ariaLabel ?? accessibilityLabel ?? t('stepper.ariaLabel');
    const isHorizontal = orientation === 'horizontal';

    const listProps: Record<string, unknown> = {
        role: 'list',
        accessibilityRole: 'list',
        'aria-label': label,
        accessibilityLabel: label,
        ...(testID !== undefined ? { testID } : {}),
    };

    return (
        <StepperContext.Provider value={{ orientation, onStepPress, total: steps.length }}>
            <View
                ref={ref}
                {...listProps}
                className={cn(isHorizontal ? 'flex-row items-start' : 'flex-col', className)}
                style={[
                    isHorizontal
                        ? { flexDirection: 'row', alignItems: 'flex-start', alignSelf: 'stretch' }
                        : { flexDirection: 'column' },
                    style,
                ]}
            >
                {steps.map((child, index) => (
                    <StepPositionContext.Provider
                        key={child.key ?? index}
                        value={{
                            index,
                            status: statuses[index] ?? 'upcoming',
                            previousComplete: index > 0 && statuses[index - 1] === 'complete',
                        }}
                    >
                        {child}
                    </StepPositionContext.Provider>
                ))}
            </View>
        </StepperContext.Provider>
    );
};

/**
 * One step inside a `<Stepper>`. Must be a direct child of one; throws with
 * a clear message if not.
 */
export const StepperStep = ({ title, description, className, testID }: StepperStepProps) => {
    const stepper = useContext(StepperContext);
    const position = useContext(StepPositionContext);
    if (!stepper || !position) {
        throw new Error('<Stepper.Step> must be rendered as a direct child of a <Stepper>.');
    }
    const colors = useThemeColors();
    const { t } = useTranslation();
    const CheckIcon = useSemanticIcon('checkmark');
    const ErrorIcon = useSemanticIcon('alertTriangle');

    const { index, status, previousComplete } = position;
    const { orientation, onStepPress, total } = stepper;
    const isHorizontal = orientation === 'horizontal';
    const isFirst = index === 0;
    const isLast = index === total - 1;
    const isPressable = onStepPress !== undefined && status === 'complete';

    const accessibleName = t('stepper.stepLabel', {
        step: index + 1,
        total,
        title,
        status: t(`stepper.status.${status}`),
    });

    const primary = colors.semantic.interactive.primary;
    const lineIdle = colors.semantic.border.strong;
    const indicatorStyle: ViewStyle = (() => {
        const base: ViewStyle = {
            width: INDICATOR_SIZE,
            height: INDICATOR_SIZE,
            borderRadius: INDICATOR_SIZE / 2,
            borderWidth: CONNECTOR_THICKNESS,
            alignItems: 'center',
            justifyContent: 'center',
        };
        if (status === 'complete') {
            return { ...base, backgroundColor: primary, borderColor: primary };
        }
        if (status === 'error') {
            return { ...base, backgroundColor: colors.color.dangerText, borderColor: colors.color.dangerText };
        }
        if (status === 'current') {
            return { ...base, backgroundColor: colors.semantic.background.elevated, borderColor: primary };
        }
        return {
            ...base,
            backgroundColor: colors.semantic.background.elevated,
            borderColor: colors.color.neutral['400'],
        };
    })();
    const numberStyle: TextStyle = {
        fontFamily: colors.fontFamily.body,
        fontSize: px(colors.fontSize.xs),
        fontWeight: colors.fontWeight.semibold as '600',
        // Keeps one- and two-digit step numbers the same optical width.
        fontVariant: ['tabular-nums'],
        color: status === 'current' ? colors.semantic.text.default : colors.semantic.text.muted,
    };
    const titleStyle: TextStyle = {
        fontFamily: colors.fontFamily.body,
        fontSize: px(colors.fontSize.sm),
        fontWeight: (status === 'current' ? colors.fontWeight.semibold : colors.fontWeight.medium) as '500',
        color:
            status === 'error'
                ? colors.color.dangerText
                : status === 'upcoming'
                  ? colors.semantic.text.muted
                  : colors.semantic.text.default,
        textAlign: isHorizontal ? 'center' : 'left',
    };
    const descriptionStyle: TextStyle = {
        fontFamily: colors.fontFamily.body,
        fontSize: px(colors.fontSize.xs),
        color: colors.semantic.text.muted,
        textAlign: isHorizontal ? 'center' : 'left',
    };

    // The indicator is decoration for assistive tech: number, check mark, and
    // error icon are all restated in words by the step's accessible name.
    const indicator = (
        <View {...HIDDEN_FROM_ASSISTIVE_TECH} style={indicatorStyle}>
            {status === 'complete' ? (
                <CheckIcon size={INDICATOR_ICON_SIZE} color={colors.semantic.text.inverted} />
            ) : status === 'error' ? (
                <ErrorIcon size={INDICATOR_ICON_SIZE} color={colors.semantic.text.inverted} />
            ) : (
                <RNText style={numberStyle}>{index + 1}</RNText>
            )}
        </View>
    );

    const connector = (visible: boolean, filled: boolean): ReactElement => {
        const lineStyle: ViewStyle = isHorizontal
            ? { flex: 1, height: CONNECTOR_THICKNESS }
            : { flex: 1, width: CONNECTOR_THICKNESS, minHeight: px(colors.spacing['4']) };
        return (
            <View style={[lineStyle, { backgroundColor: visible ? (filled ? primary : lineIdle) : 'transparent' }]} />
        );
    };

    const labels = (
        <>
            <RNText style={titleStyle}>{title}</RNText>
            {description !== undefined && description !== null && description !== false ? (
                <RNText style={descriptionStyle}>{description}</RNText>
            ) : null}
        </>
    );

    const gap = px(colors.spacing['2']);
    const content = isHorizontal ? (
        <>
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    alignSelf: 'stretch',
                    gap: px(colors.spacing['1']),
                }}
            >
                {connector(!isFirst, previousComplete)}
                {indicator}
                {connector(!isLast, status === 'complete')}
            </View>
            <View style={{ alignItems: 'center', gap: 2, paddingHorizontal: px(colors.spacing['1']) }}>{labels}</View>
        </>
    ) : (
        <>
            <View style={{ alignItems: 'center', gap: px(colors.spacing['1']) }}>
                {indicator}
                {isLast ? null : connector(true, status === 'complete')}
            </View>
            <View
                style={{
                    flex: 1,
                    minWidth: 0,
                    gap: 2,
                    // Optically centers a single-line title on the indicator.
                    paddingTop: px(colors.spacing['1']),
                    paddingBottom: isLast ? 0 : px(colors.spacing['4']),
                }}
            >
                {labels}
            </View>
        </>
    );
    const contentStyle: ViewStyle = isHorizontal
        ? { flexDirection: 'column', alignItems: 'center', alignSelf: 'stretch', gap }
        : { flexDirection: 'row', alignItems: 'stretch', gap: px(colors.spacing['3']) };

    const itemProps: Record<string, unknown> = {
        role: 'listitem',
        ...(status === 'current' ? { 'aria-current': 'step' } : {}),
        ...(testID !== undefined ? { testID } : {}),
        // A pressable step carries the name on its button instead; naming
        // both would make screen readers announce the step twice.
        ...(isPressable ? {} : { 'aria-label': accessibleName, accessibilityLabel: accessibleName }),
        // Native screen readers only focus a plain View as one element when
        // it is marked accessible; the web has no such prop.
        ...(isPressable || isWeb ? {} : { accessible: true }),
    };

    return (
        <View
            {...itemProps}
            className={cn(isHorizontal ? 'flex-1' : undefined, className)}
            style={isHorizontal ? { flex: 1, minWidth: 0 } : undefined}
        >
            {isPressable ? (
                <Pressable
                    role="button"
                    accessibilityRole="button"
                    accessibilityLabel={accessibleName}
                    aria-label={accessibleName}
                    onPress={() => onStepPress?.(index)}
                    {...(testID !== undefined ? { testID: `${testID}-button` } : {})}
                    style={contentStyle}
                >
                    {content}
                </Pressable>
            ) : (
                <View style={contentStyle}>{content}</View>
            )}
        </View>
    );
};

/**
 * Public `Stepper` value: the list container plus its `.Step` static member.
 *
 * `Object.assign` produces a value whose inferred type carries the static
 * property, so `.d.ts` consumers can write `<Stepper.Step>` without a
 * separate import.
 */
export const Stepper = Object.assign(StepperRoot, {
    Step: StepperStep,
});
