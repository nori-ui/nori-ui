import type { TextProps as RNTextProps } from 'react-native';
import { Text as RNText } from 'react-native';
import { cn } from '../../utils/cn';

export type TextVariant = 'body-xs' | 'body-sm' | 'body-md' | 'body-lg' | 'heading-1' | 'heading-2' | 'heading-3';

export type TextProps = RNTextProps & {
    variant?: TextVariant;
    className?: string;
    testID?: string;
};

const VARIANT_CLASSES: Record<TextVariant, string> = {
    'body-xs': 'text-xs leading-normal',
    'body-sm': 'text-sm leading-normal',
    'body-md': 'text-md leading-normal',
    'body-lg': 'text-lg leading-relaxed',
    'heading-1': 'text-4xl leading-tight font-bold',
    'heading-2': 'text-3xl leading-tight font-semibold',
    'heading-3': 'text-2xl leading-tight font-semibold',
};

const HEADING_VARIANTS: Readonly<Set<TextVariant>> = new Set(['heading-1', 'heading-2', 'heading-3']);

/**
 * Typography primitive. Renders a react-native <Text>; on web via RN-Web
 * it becomes a <div role="..."> with the appropriate className.
 *
 * RSC-safe: pure render, no hooks.
 */
export function Text({ variant = 'body-md', className, testID, children, ...rest }: TextProps) {
    const isHeading = HEADING_VARIANTS.has(variant);
    const role = isHeading ? 'header' : rest.accessibilityRole;
    return (
        <RNText
            testID={testID}
            {...rest}
            {...(role !== undefined ? { accessibilityRole: role } : {})}
            className={cn(VARIANT_CLASSES[variant], className)}
        >
            {children}
        </RNText>
    );
}
