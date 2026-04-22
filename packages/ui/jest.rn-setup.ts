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
        accessibilityState?: { disabled?: boolean; selected?: boolean; checked?: boolean };
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

        const domProps: Record<string, unknown> = { ...rest };
        if (className !== undefined) domProps.className = className;
        if (testID !== undefined) domProps['data-testid'] = testID;
        const role = mapA11yRole(accessibilityRole);
        if (role !== undefined) domProps.role = role;
        if (accessibilityLabel !== undefined) domProps['aria-label'] = accessibilityLabel;
        if (accessibilityState?.disabled !== undefined) domProps['aria-disabled'] = accessibilityState.disabled;
        if (accessibilityState?.selected !== undefined) domProps['aria-selected'] = accessibilityState.selected;
        if (accessibilityState?.checked !== undefined) domProps['aria-checked'] = accessibilityState.checked;
        if (accessibilityState?.busy !== undefined) domProps['aria-busy'] = accessibilityState.busy;
        const flatStyle = flattenStyle(style);
        if (flatStyle !== undefined) domProps.style = flatStyle;
        return React.createElement(tag, domProps, children);
    };

    const View = (props: Props) => buildDomProps(props, 'div');
    const Text = (props: Props) => buildDomProps(props, 'span');
    const ScrollView = (props: Props) => buildDomProps(props, 'div');
    const SafeAreaView = (props: Props) => buildDomProps(props, 'div');
    const StatusBar = () => null;
    const Pressable = (props: Props) => buildDomProps(props, 'div');
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

    return {
        __esModule: true,
        View,
        Text,
        ScrollView,
        SafeAreaView,
        StatusBar,
        Pressable,
        ActivityIndicator,
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
