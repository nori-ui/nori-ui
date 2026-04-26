// RN-Web rendering shims. Keeps the jsdom project stable for both plain
// DOM tests (Slot, Icon wrapper) and RN-primitive tests (Text, Box, HStack, VStack).
//
// The key insight: in production, NativeWind transforms the `className` prop on
// react-native primitives into inline styles while still forwarding the class
// string to the DOM (via its jsx runtime). In the Jest jsdom project we don't
// compile NativeWind, and react-native-web by itself strips `className` and
// replaces it with a CSS-in-JS hash. That breaks className-based assertions.
//
// Solution: mock the `react-native` module so that Text/View render a simple
// DOM element which forwards `className` and `data-testid` verbatim. Tests can
// then assert substring presence of Tailwind class names directly on the DOM
// `className` attribute. This matches the runtime shape NativeWind produces.

import * as React from 'react';

jest.mock('react-native', () => {
    type Props = {
        children?: React.ReactNode;
        className?: string;
        testID?: string;
        accessibilityRole?: string;
        accessibilityLabel?: string;
        accessibilityState?: {
            disabled?: boolean;
            selected?: boolean;
            checked?: boolean | 'mixed';
            busy?: boolean;
        };
        style?: React.CSSProperties;
    } & Record<string, unknown>;

    const mapA11yRole = (role?: string): string | undefined => {
        if (!role) return undefined;
        if (role === 'header') return 'heading';
        if (role === 'button') return 'button';
        if (role === 'image') return 'img';
        if (role === 'link') return 'link';
        if (role === 'none') return 'presentation';
        return role;
    };

    const flattenStyle = (style: unknown): React.CSSProperties | undefined => {
        if (style === undefined || style === null || style === false) return undefined;
        if (Array.isArray(style)) {
            const out: Record<string, unknown> = {};
            for (const entry of style) {
                const sub = flattenStyle(entry);
                if (sub) Object.assign(out, sub);
            }
            return out as React.CSSProperties;
        }
        if (typeof style === 'object') return style as React.CSSProperties;
        return undefined;
    };

    const buildDomProps = (props: Props, tag: 'div' | 'span') => {
        const {
            children,
            className,
            testID,
            accessibilityRole,
            accessibilityLabel,
            accessibilityState,
            style,
            ...rest
        } = props;
        const { nativeID, ...domRest } = rest as Props & { nativeID?: string };

        const domProps: Record<string, unknown> = { ...domRest };
        if (className !== undefined) domProps.className = className;
        if (testID !== undefined) domProps['data-testid'] = testID;
        if (nativeID !== undefined) domProps.id = nativeID;
        const existingRole = domProps.role as string | undefined;
        const role = existingRole ?? mapA11yRole(accessibilityRole);
        if (role !== undefined) domProps.role = role;
        if (accessibilityLabel !== undefined && domProps['aria-label'] === undefined) {
            domProps['aria-label'] = accessibilityLabel;
        }
        // Explicit aria-* props (passed via rest) take precedence over accessibilityState.
        if (accessibilityState?.disabled !== undefined && domProps['aria-disabled'] === undefined) {
            domProps['aria-disabled'] = accessibilityState.disabled;
        }
        if (accessibilityState?.selected !== undefined && domProps['aria-selected'] === undefined) {
            domProps['aria-selected'] = accessibilityState.selected;
        }
        if (accessibilityState?.checked !== undefined && domProps['aria-checked'] === undefined) {
            domProps['aria-checked'] = accessibilityState.checked;
        }
        if (accessibilityState?.busy !== undefined && domProps['aria-busy'] === undefined) {
            domProps['aria-busy'] = accessibilityState.busy;
        }
        const flatStyle = flattenStyle(style);
        if (flatStyle !== undefined) domProps.style = flatStyle;
        return React.createElement(tag, domProps, children);
    };

    const View = (props: Props) => buildDomProps(props, 'div');
    const Text = (props: Props) => buildDomProps(props, 'span');
    const ScrollView = (props: Props) => buildDomProps(props, 'div');
    const SafeAreaView = (props: Props) => buildDomProps(props, 'div');
    const StatusBar = () => null;
    const Pressable = (props: Props) => {
        const { onPress, disabled, ...rest } = props as Props & { onPress?: (ev: unknown) => void; disabled?: boolean };
        const nextProps: Props = { ...rest };
        if (onPress !== undefined) {
            (nextProps as { onClick?: (ev: unknown) => void }).onClick = (ev) => {
                if (disabled) return;
                onPress(ev);
            };
        }
        if (disabled !== undefined) {
            (nextProps as { disabled?: boolean }).disabled = disabled;
        }
        return buildDomProps(nextProps, 'div');
    };
    const TextInput = (props: Props) => {
        const {
            children,
            className,
            testID,
            accessibilityRole,
            accessibilityLabel,
            accessibilityState,
            style,
            ...rest
        } = props as Props & {
            value?: string;
            defaultValue?: string;
            placeholder?: string;
            editable?: boolean;
            multiline?: boolean;
            numberOfLines?: number;
            nativeID?: string;
            onChangeText?: (text: string) => void;
            onChange?: (e: unknown) => void;
        };
        const {
            value,
            defaultValue,
            placeholder,
            editable,
            multiline,
            numberOfLines,
            nativeID,
            onChangeText,
            onChange,
            ...other
        } = rest as Props & {
            value?: string;
            defaultValue?: string;
            placeholder?: string;
            editable?: boolean;
            multiline?: boolean;
            numberOfLines?: number;
            nativeID?: string;
            onChangeText?: (text: string) => void;
            onChange?: (e: unknown) => void;
        };

        const tag = multiline ? 'textarea' : 'input';
        const domProps: Record<string, unknown> = { ...other };
        if (className !== undefined) domProps.className = className;
        if (testID !== undefined) domProps['data-testid'] = testID;
        if (nativeID !== undefined) domProps.id = nativeID;
        if (accessibilityLabel !== undefined) domProps['aria-label'] = accessibilityLabel;
        const role = mapA11yRole(accessibilityRole);
        if (role !== undefined) domProps.role = role;
        if (accessibilityState?.disabled !== undefined) domProps['aria-disabled'] = accessibilityState.disabled;
        if (value !== undefined) domProps.value = value;
        if (defaultValue !== undefined) domProps.defaultValue = defaultValue;
        if (placeholder !== undefined) domProps.placeholder = placeholder;
        if (editable === false) domProps.disabled = true;
        if (multiline && numberOfLines !== undefined) domProps.rows = numberOfLines;
        const flatStyle = flattenStyle(style);
        if (flatStyle !== undefined) domProps.style = flatStyle;

        domProps.onChange = (e: { target?: { value?: string } } & Record<string, unknown>) => {
            if (editable === false) return;
            const next = e?.target?.value ?? '';
            if (onChangeText) onChangeText(next);
            if (onChange) onChange(e);
        };

        return React.createElement(tag, domProps);
    };
    const ActivityIndicator = (props: Props) => {
        const { size, color, ...rest } = props as Props & { size?: number | string; color?: string };
        const px = typeof size === 'number' ? size : size === 'large' ? 36 : size === 'small' ? 16 : undefined;
        const sizeStyle: React.CSSProperties | undefined = px !== undefined ? { width: px, height: px } : undefined;
        const colorStyle: React.CSSProperties | undefined = color !== undefined ? { color } : undefined;
        const mergedStyle = flattenStyle([sizeStyle, colorStyle, (rest as { style?: unknown }).style]);
        const nextProps: Props = {
            ...rest,
            accessibilityRole: rest.accessibilityRole ?? 'progressbar',
            style: mergedStyle,
        };
        return buildDomProps(nextProps, 'div');
    };

    type ImageProps = Props & {
        source?: { uri?: string } | number;
        onError?: (e: unknown) => void;
        onLoad?: (e: unknown) => void;
    };
    const Image = (props: ImageProps) => {
        const { source, onError, onLoad, accessibilityLabel, style, testID, ...rest } = props;
        const uri = source && typeof source === 'object' ? source.uri : undefined;
        const domProps: Record<string, unknown> = { ...rest };
        if (uri !== undefined) domProps.src = uri;
        if (testID !== undefined) domProps['data-testid'] = testID;
        if (accessibilityLabel !== undefined) {
            domProps['aria-label'] = accessibilityLabel;
            domProps.alt = accessibilityLabel;
        } else {
            // <img> requires alt for valid HTML; default to empty (decorative).
            domProps.alt = '';
        }
        if (onError !== undefined) domProps.onError = onError;
        if (onLoad !== undefined) domProps.onLoad = onLoad;
        const flatStyle = flattenStyle(style);
        if (flatStyle !== undefined) domProps.style = flatStyle;
        return React.createElement('img', domProps);
    };

    type ModalProps = Props & {
        visible?: boolean;
        onRequestClose?: () => void;
        animationType?: string;
        transparent?: boolean;
    };
    const Modal = (props: ModalProps) => {
        const { visible, onRequestClose, animationType, transparent, children, ...rest } = props;
        if (!visible) return null;
        // Mirror what react-native-web's Modal does: render the children
        // in-place inside a fixed-position overlay div. Tests can query
        // the modal content directly without portal traversal.
        const domProps: Record<string, unknown> = { ...rest, 'data-modal': 'true' };
        if (rest.testID !== undefined) {
            domProps['data-testid'] = rest.testID;
            delete (domProps as { testID?: unknown }).testID;
        }
        return React.createElement('div', domProps, children);
    };

    return {
        __esModule: true,
        View,
        Text,
        ScrollView,
        SafeAreaView,
        StatusBar,
        Pressable,
        TextInput,
        ActivityIndicator,
        Image,
        Modal,
        StyleSheet: {
            create: <T extends Record<string, unknown>>(styles: T) => styles,
            flatten: (style: unknown) => style,
            hairlineWidth: 1,
            absoluteFill: {},
            absoluteFillObject: {},
        },
        Platform: { OS: 'web', select: <T>(obj: { web?: T; default?: T }) => obj.web ?? obj.default },
    };
});
