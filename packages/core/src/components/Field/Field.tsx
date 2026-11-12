'use client';

import {
    Children,
    cloneElement,
    createContext,
    isValidElement,
    type ReactElement,
    type ReactNode,
    useContext,
    useEffect,
    useId,
    useMemo,
    useRef,
} from 'react';
import { Platform, Pressable, Text as RNText, View } from 'react-native';
import { useTranslation } from '../../i18n/use-translation';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';
import { Spinner } from '../Spinner';

type FieldContextValue = {
    fieldId: string;
    labelId: string;
    descriptionId: string;
    errorId: string;
    hasError: boolean;
    hasDescription: boolean;
    describedBy: string | undefined;
    disabled: boolean;
    required: boolean;
    validating: boolean;
    name?: string;
    error?: string | null;
    isGroup: boolean;
    /** Plain-text label, when the label is a string. Names the control on iOS. */
    labelText?: string;
};

const FieldContext = createContext<FieldContextValue | null>(null);

const useFieldContextStrict = (caller: string): FieldContextValue => {
    const ctx = useContext(FieldContext);
    if (!ctx) {
        throw new Error(`[Field] ${caller} must be used inside <Field> or <Field.Group>.`);
    }
    return ctx;
};

const childHasDisplayName = (child: ReactNode, name: string): boolean => {
    if (!isValidElement(child)) {
        return false;
    }
    const t = child.type as { displayName?: string } | string;
    return typeof t !== 'string' && t?.displayName === name;
};

/** Display names that mark a compound-mode child. */
const COMPOUND_DISPLAY_NAMES = ['Field.Label', 'Field.Description', 'Field.Error', 'Field.Control'];

const isCompoundChild = (child: ReactNode): boolean =>
    COMPOUND_DISPLAY_NAMES.some((name) => childHasDisplayName(child, name));

/**
 * Finds the first element matching `predicate`, looking through fragments
 * and wrapper elements (a `Field.Label` inside a layout `View` still counts).
 * The search stops at compound parts and at nested Fields, whose parts
 * belong to that inner Field.
 */
const findFieldPart = (
    children: ReactNode,
    predicate: (child: ReactElement) => boolean,
    isNestedField: (child: ReactElement) => boolean
): ReactElement | undefined => {
    let found: ReactElement | undefined;
    Children.forEach(children, (child) => {
        if (found !== undefined || !isValidElement(child)) {
            return;
        }
        if (predicate(child)) {
            found = child;
            return;
        }
        if (isCompoundChild(child) || isNestedField(child)) {
            return;
        }
        found = findFieldPart(
            (child as ReactElement<{ children?: ReactNode }>).props.children,
            predicate,
            isNestedField
        );
    });
    return found;
};

const isNonEmptyNode = (node: ReactNode): boolean =>
    node !== undefined && node !== null && node !== false && node !== '';

export type FieldProps = {
    // Shorthand slot props
    label?: ReactNode;
    description?: ReactNode;
    error?: ReactNode;

    // State flags
    name?: string;
    required?: boolean;
    disabled?: boolean;
    validating?: boolean;

    // Layout
    orientation?: 'vertical' | 'horizontal';
    id?: string;

    children: ReactNode;
    className?: string;
    testID?: string;
};

type FieldRootInternalProps = FieldProps & { isGroup?: boolean };

const FieldRoot = ({
    name,
    required = false,
    disabled = false,
    error = null,
    label,
    description,
    validating = false,
    orientation = 'vertical',
    id,
    children,
    className,
    testID,
    isGroup = false,
}: FieldRootInternalProps) => {
    const colors = useThemeColors();
    const reactId = useId();
    const fieldId = id ?? `nori-ui-field-${reactId}`;
    const labelId = `${fieldId}-label`;
    const descriptionId = `${fieldId}-desc`;
    const errorId = `${fieldId}-error`;

    // ---------- mode detection ----------
    const isCompoundMode = useMemo(
        () => findFieldPart(children, isCompoundChild, isNestedFieldElement) !== undefined,
        [children]
    );

    // ---------- derive hasDescription / hasError ----------
    const hasDescription = useMemo(() => {
        if (!isCompoundMode) {
            return isNonEmptyNode(description);
        }
        return (
            findFieldPart(
                children,
                (child) => childHasDisplayName(child, 'Field.Description'),
                isNestedFieldElement
            ) !== undefined
        );
    }, [isCompoundMode, description, children]);

    const hasError = useMemo(() => {
        if (!isCompoundMode) {
            return Boolean(error);
        }
        // compound mode: scan for a Field.Error part with truthy children
        const errorPart = findFieldPart(
            children,
            (child) =>
                childHasDisplayName(child, 'Field.Error') &&
                isNonEmptyNode((child as ReactElement<{ children?: ReactNode }>).props.children),
            isNestedFieldElement
        );
        // also check the legacy `error` prop usage in compound mode
        return errorPart !== undefined || isNonEmptyNode(error);
    }, [isCompoundMode, error, children]);

    // iOS has no `aria-labelledby`, so a string label is also handed to the
    // control as its accessibility label.
    const labelText = useMemo(() => {
        const toText = (node: ReactNode): string | undefined =>
            typeof node === 'string' || typeof node === 'number' ? String(node) : undefined;
        if (!isCompoundMode) {
            return toText(label);
        }
        const labelPart = findFieldPart(
            children,
            (child) => childHasDisplayName(child, 'Field.Label'),
            isNestedFieldElement
        );
        return toText((labelPart as ReactElement<{ children?: ReactNode }> | undefined)?.props.children);
    }, [isCompoundMode, label, children]);

    const describedBy = useMemo(() => {
        const ids: string[] = [];
        if (hasDescription) {
            ids.push(descriptionId);
        }
        if (hasError) {
            ids.push(errorId);
        }
        return ids.length === 0 ? undefined : ids.join(' ');
    }, [hasDescription, hasError, descriptionId, errorId]);

    const value: FieldContextValue = {
        fieldId,
        labelId,
        descriptionId,
        errorId,
        hasError,
        hasDescription,
        describedBy,
        disabled,
        required,
        validating,
        ...(name !== undefined ? { name } : {}),
        // In compound mode pass `error` (string) so Field.Error can fall back to it.
        // In shorthand mode the error prop may be ReactNode; only pass when it is a string/null.
        ...(error !== null && error !== undefined && typeof error === 'string' ? { error } : {}),
        isGroup,
        ...(labelText !== undefined ? { labelText } : {}),
    };

    // ---------- dev warning for mixed usage ----------
    const warnedRef = useRef(false);
    useEffect(() => {
        if (process.env.NODE_ENV === 'production' || warnedRef.current) {
            return;
        }
        const hasShorthand = label !== undefined || description !== undefined || error !== undefined;
        if (hasShorthand && isCompoundMode) {
            warnedRef.current = true;
            // biome-ignore lint/suspicious/noConsole: intentional dev-mode warning
            console.warn(
                '[Field] Mixing shorthand props (label/description/error) with compound children (Field.Label/Field.Description/Field.Error) is not supported. The compound children will win. To suppress this warning, use only one mode.'
            );
        }
    }, [label, description, error, isCompoundMode]);

    // ---------- layout ----------
    const containerStyle =
        orientation === 'horizontal'
            ? {
                  flexDirection: 'row' as const,
                  alignItems: 'flex-start' as const,
                  gap: px(colors.spacing['3']),
              }
            : { flexDirection: 'column' as const, gap: px(colors.spacing['1']) };

    const containerExtra: Record<string, unknown> = {};
    if (testID !== undefined) {
        containerExtra.testID = testID;
    }
    containerExtra['data-orientation'] = orientation;
    if (isGroup) {
        containerExtra.role = 'group';
        containerExtra['aria-labelledby'] = labelId;
        containerExtra.accessibilityRole = 'none';
    }
    if (validating) {
        containerExtra['data-validating'] = '';
        containerExtra['aria-busy'] = true;
    }

    // ---------- shorthand mode rendering ----------
    const renderShorthand = () => {
        // Determine if there's exactly one non-Field.* child we can auto-wrap.
        const childArray = Children.toArray(children);
        const controlChild =
            childArray.length === 1 && isValidElement(childArray[0]) ? (childArray[0] as ReactElement) : null;

        return (
            <>
                {label !== undefined && label !== null && label !== false ? <FieldLabel>{label}</FieldLabel> : null}
                {description !== undefined && description !== null && description !== false && description !== '' ? (
                    <FieldDescription>{description}</FieldDescription>
                ) : null}
                {controlChild !== null ? <FieldControl>{controlChild}</FieldControl> : children}
                {error !== undefined && error !== null && error !== false && error !== '' ? (
                    <FieldError>{error}</FieldError>
                ) : null}
            </>
        );
    };

    return (
        <FieldContext.Provider value={value}>
            <View style={containerStyle} {...(className !== undefined ? { className } : {})} {...containerExtra}>
                {isCompoundMode ? children : renderShorthand()}
                {validating ? <Spinner size="sm" /> : null}
            </View>
        </FieldContext.Provider>
    );
};

const FieldLabel = ({ children }: { children: ReactNode }) => {
    const ctx = useFieldContextStrict('Field.Label');
    const colors = useThemeColors();
    const { t } = useTranslation();
    const requiredIndicator = t('field.requiredIndicator');
    const requiredLabel = t('field.requiredLabel');

    const focusInput = () => {
        if (typeof document !== 'undefined') {
            const el = document.getElementById(ctx.fieldId);
            if (el && typeof (el as HTMLElement).focus === 'function') {
                (el as HTMLElement).focus();
            }
        }
    };

    return (
        <Pressable onPress={focusInput} accessibilityRole="none" disabled={ctx.disabled}>
            <RNText
                nativeID={ctx.labelId}
                {...({ id: ctx.labelId } as Record<string, unknown>)}
                accessibilityRole="text"
                style={{
                    fontFamily: colors.fontFamily.body,
                    fontSize: px(colors.fontSize.sm),
                    fontWeight: colors.fontWeight.medium as '500',
                    color: ctx.disabled ? colors.semantic.text.muted : colors.semantic.text.default,
                }}
            >
                {children}
                {ctx.required ? (
                    <RNText
                        accessibilityLabel={requiredLabel}
                        {...({ 'aria-label': requiredLabel } as Record<string, unknown>)}
                        style={{ color: colors.color.dangerText }}
                    >
                        {` ${requiredIndicator}`}
                    </RNText>
                ) : null}
            </RNText>
        </Pressable>
    );
};
FieldLabel.displayName = 'Field.Label';

const FieldControl = ({ children }: { children: ReactElement }) => {
    const ctx = useFieldContextStrict('Field.Control');
    if (Children.count(children) !== 1 || !isValidElement(children)) {
        throw new Error('[Field.Control] expects exactly one child element.');
    }
    const child = children as ReactElement<Record<string, unknown>>;
    const merged: Record<string, unknown> = {
        id: child.props.id ?? ctx.fieldId,
        accessibilityLabelledBy: ctx.labelId,
        'aria-labelledby': ctx.labelId,
    };
    if (
        Platform.OS === 'ios' &&
        ctx.labelText !== undefined &&
        child.props.accessibilityLabel === undefined &&
        child.props['aria-label'] === undefined &&
        child.props.label === undefined
    ) {
        merged.accessibilityLabel = ctx.labelText;
    }
    if (ctx.name !== undefined && child.props.name === undefined) {
        merged.name = ctx.name;
    }
    if (ctx.describedBy !== undefined) {
        merged['aria-describedby'] = ctx.describedBy;
        merged.accessibilityDescribedBy = ctx.describedBy;
    }
    if (ctx.hasError) {
        merged['aria-invalid'] = true;
    }
    if (ctx.required) {
        merged['aria-required'] = true;
    }
    if (ctx.disabled || child.props.disabled) {
        merged.disabled = true;
    }
    return cloneElement(child, merged);
};
FieldControl.displayName = 'Field.Control';

const FieldDescription = ({ children }: { children: ReactNode }) => {
    const ctx = useFieldContextStrict('Field.Description');
    const colors = useThemeColors();
    return (
        <RNText
            nativeID={ctx.descriptionId}
            {...({ id: ctx.descriptionId } as Record<string, unknown>)}
            style={{
                fontFamily: colors.fontFamily.body,
                fontSize: px(colors.fontSize.sm),
                color: colors.semantic.text.muted,
            }}
        >
            {children}
        </RNText>
    );
};
FieldDescription.displayName = 'Field.Description';

const FieldError = ({ children }: { children?: ReactNode }) => {
    const ctx = useFieldContextStrict('Field.Error');
    const colors = useThemeColors();
    const content = children ?? ctx.error;
    if (content === null || content === undefined || content === '' || content === false) {
        return null;
    }
    return (
        <RNText
            nativeID={ctx.errorId}
            {...({ id: ctx.errorId, role: 'alert' } as Record<string, unknown>)}
            accessibilityRole="text"
            style={{
                fontFamily: colors.fontFamily.body,
                fontSize: px(colors.fontSize.sm),
                color: colors.color.dangerText,
            }}
        >
            {content}
        </RNText>
    );
};
FieldError.displayName = 'Field.Error';

export type FieldGroupProps = Omit<FieldProps, 'name'>;

const FieldGroup = (props: FieldGroupProps) => <FieldRoot {...(props as FieldProps)} isGroup />;
FieldGroup.displayName = 'Field.Group';

function isNestedFieldElement(child: ReactElement): boolean {
    return child.type === FieldRoot || child.type === FieldGroup;
}

export const Field = Object.assign(FieldRoot as (props: FieldProps) => ReactElement, {
    Label: FieldLabel,
    Description: FieldDescription,
    Control: FieldControl,
    Error: FieldError,
    Group: FieldGroup,
});
