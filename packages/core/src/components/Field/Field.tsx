'use client';

import {
    Children,
    cloneElement,
    createContext,
    isValidElement,
    type ReactElement,
    type ReactNode,
    useContext,
    useId,
    useMemo,
} from 'react';
import { Pressable, Text as RNText, View } from 'react-native';
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

export type FieldProps = {
    name?: string;
    required?: boolean;
    disabled?: boolean;
    error?: string | null;
    validating?: boolean;
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

    const hasDescription = useMemo(() => {
        let found = false;
        Children.forEach(children, (child) => {
            if (childHasDisplayName(child, 'Field.Description')) {
                found = true;
            }
        });
        return found;
    }, [children]);

    const hasError = Boolean(error);

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
        ...(error !== null ? { error } : {}),
        isGroup,
    };

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

    return (
        <FieldContext.Provider value={value}>
            <View style={containerStyle} {...(className !== undefined ? { className } : {})} {...containerExtra}>
                {children}
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
                        style={{ color: colors.color.danger }}
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
                color: colors.color.danger,
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

export const Field = Object.assign(FieldRoot as (props: FieldProps) => ReactElement, {
    Label: FieldLabel,
    Description: FieldDescription,
    Control: FieldControl,
    Error: FieldError,
    Group: FieldGroup,
});
