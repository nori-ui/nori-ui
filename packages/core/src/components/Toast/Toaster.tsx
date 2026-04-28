'use client';

import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    PanResponder,
    type PanResponderInstance,
    Platform,
    Pressable,
    Text as RNText,
    StyleSheet,
    View,
    type ViewStyle,
} from 'react-native';
import { useThemeColors } from '../../theme/use-theme-colors';
import { getSonner } from './sonner-bridge';
import * as store from './toast-store';
import type { ActiveToast, ToasterPosition, ToasterProps, ToastTone } from './types';

const DEFAULT_DURATION = 4000;
const DEFAULT_GAP = 14;
const DEFAULT_OFFSET = 24;
const DEFAULT_VISIBLE = 3;
const SWIPE_DISMISS_THRESHOLD = 64;

/**
 * Toast viewport. Mount once near the app root; the imperative
 * `toast(...)` function pushes to it.
 *
 * - On web, renders sonner's own `<Toaster>` and maps our cross-platform
 *   props to its surface. All sonner features (richColors, expand,
 *   closeButton, swipe-to-dismiss, keyboard a11y, screen-reader live
 *   region) are available unchanged.
 *
 * - On native, renders an Animated viewport positioned by `position`,
 *   stacking up to `visibleToasts` toasts with `gap` between them and
 *   `offset` from the viewport edge. Each toast supports swipe-to-dismiss
 *   (horizontal drag past `SWIPE_DISMISS_THRESHOLD`) and an auto-dismiss
 *   timer driven by the toast's `duration`.
 *
 * The same JSX renders on both platforms — userland never branches on
 * `Platform.OS`.
 */
export function Toaster(props: ToasterProps): React.ReactElement | null {
    if (Platform.OS === 'web') {
        const sonner = getSonner();
        if (sonner) {
            // Sonner's Toaster accepts the same prop names + meanings — the
            // only thing we strip is `gap` (sonner derives spacing
            // internally). Pass through unchanged otherwise.
            const sonnerProps: Record<string, unknown> = {
                position: props.position ?? 'top-center',
                visibleToasts: props.visibleToasts ?? DEFAULT_VISIBLE,
                offset: props.offset ?? DEFAULT_OFFSET,
                closeButton: props.closeButton ?? false,
                richColors: props.richColors ?? false,
                expand: props.expand ?? false,
                duration: props.duration ?? DEFAULT_DURATION,
            };
            return createElement(sonner.Toaster, sonnerProps);
        }
        // Sonner couldn't load on web — fall through to the native viewport
        // so the app at least gets a working toast UI.
    }
    return <NativeToaster {...props} />;
}
Toaster.displayName = 'Toaster';

function useStore(): readonly ActiveToast[] {
    const [snapshot, setSnapshot] = useState(store.getSnapshot);
    useEffect(() => store.subscribe(() => setSnapshot(store.getSnapshot())), []);
    return snapshot;
}

function NativeToaster(props: ToasterProps): React.ReactElement | null {
    const {
        position = 'top-center',
        visibleToasts = DEFAULT_VISIBLE,
        gap = DEFAULT_GAP,
        offset = DEFAULT_OFFSET,
        closeButton = false,
        richColors = false,
        duration = DEFAULT_DURATION,
    } = props;
    const all = useStore();
    // Group toasts by their effective position so a per-toast `position`
    // override sits in its own stack, not piled on top of toasts at the
    // viewport's default position.
    const grouped = useMemo(() => {
        const map = new Map<ToasterPosition, ActiveToast[]>();
        for (const t of all) {
            const p = t.position ?? position;
            const list = map.get(p) ?? [];
            list.push(t);
            map.set(p, list);
        }
        return map;
    }, [all, position]);
    if (all.length === 0) {
        return null;
    }
    return (
        <>
            {Array.from(grouped.entries()).map(([pos, list]) => (
                <PositionStack
                    key={pos}
                    position={pos}
                    toasts={list.slice(-visibleToasts)}
                    gap={gap}
                    offset={offset}
                    duration={duration}
                    closeButton={closeButton}
                    richColors={richColors}
                />
            ))}
        </>
    );
}

type PositionStackProps = {
    position: ToasterPosition;
    toasts: readonly ActiveToast[];
    gap: number;
    offset: number;
    duration: number;
    closeButton: boolean;
    richColors: boolean;
};

function PositionStack({ position, toasts, gap, offset, duration, closeButton, richColors }: PositionStackProps) {
    const isTop = position.startsWith('top-');
    const isCenter = position.endsWith('-center');
    const isLeft = position.endsWith('-left');
    // Anchor styles. Bottom positions stack from bottom up; top from top
    // down. `flexDirection: 'column-reverse'` on bottom anchors so newer
    // toasts appear nearer the viewport edge.
    const anchor: ViewStyle = {
        position: 'absolute',
        ...(isTop ? { top: offset } : { bottom: offset }),
        ...(isCenter
            ? { left: 0, right: 0, alignItems: 'center' }
            : isLeft
              ? { left: offset, alignItems: 'flex-start' }
              : { right: offset, alignItems: 'flex-end' }),
        // `column-reverse` for bottom anchors so newer toasts (later in
        // the array) appear closer to the viewport edge — matches sonner's
        // behavior on web.
        flexDirection: isTop ? 'column' : 'column-reverse',
        gap,
    };
    // pointerEvents: 'box-none' lets non-toast taps pass through to the
    // underlying app while still letting toast surfaces receive their
    // own touches.
    return (
        <View style={anchor} pointerEvents="box-none">
            {toasts.map((t) => (
                <ToastCard
                    key={t.id}
                    toast={t}
                    defaultDuration={duration}
                    closeButton={closeButton}
                    richColors={richColors}
                />
            ))}
        </View>
    );
}

type ToastCardProps = {
    toast: ActiveToast;
    defaultDuration: number;
    closeButton: boolean;
    richColors: boolean;
};

function ToastCard({ toast, defaultDuration, closeButton, richColors }: ToastCardProps) {
    const colors = useThemeColors();
    const tone: ToastTone = toast.tone ?? 'default';
    const translateX = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const enterY = useRef(new Animated.Value(8)).current;

    // Tone-driven palette. With richColors we use a saturated bg + inverted
    // text per tone; otherwise a neutral surface with a tone-colored
    // accent strip on the leading edge.
    const tonePalette = useMemo(() => {
        const base = {
            default: {
                bg: colors.semantic.background.default,
                fg: colors.semantic.text.default,
                accent: colors.semantic.border.default,
            },
            info: {
                bg: colors.semantic.background.default,
                fg: colors.semantic.text.default,
                accent: colors.color.info,
            },
            success: {
                bg: colors.semantic.background.default,
                fg: colors.semantic.text.default,
                accent: colors.color.success,
            },
            warning: {
                bg: colors.semantic.background.default,
                fg: colors.semantic.text.default,
                accent: colors.color.warning,
            },
            danger: {
                bg: colors.semantic.background.default,
                fg: colors.semantic.text.default,
                accent: colors.color.danger,
            },
        } as const;
        if (!richColors) {
            return base[tone];
        }
        const rich = {
            default: base.default,
            info: { bg: colors.color.info, fg: colors.semantic.text.inverted, accent: 'transparent' },
            success: { bg: colors.color.success, fg: colors.semantic.text.inverted, accent: 'transparent' },
            warning: { bg: colors.color.warning, fg: colors.semantic.text.inverted, accent: 'transparent' },
            danger: { bg: colors.color.danger, fg: colors.semantic.text.inverted, accent: 'transparent' },
        } as const;
        return rich[tone];
    }, [colors, tone, richColors]);

    // Enter animation.
    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
            Animated.timing(enterY, { toValue: 0, duration: 220, useNativeDriver: true }),
        ]).start();
    }, [opacity, enterY]);

    // Auto-dismiss timer. `Infinity` (or any non-finite) keeps it open.
    const effectiveDuration = toast.duration ?? defaultDuration;
    useEffect(() => {
        if (!Number.isFinite(effectiveDuration) || effectiveDuration <= 0) {
            return;
        }
        const handle = setTimeout(() => {
            store.dismiss(toast.id);
        }, effectiveDuration);
        return () => clearTimeout(handle);
    }, [effectiveDuration, toast.id]);

    // Swipe-to-dismiss. Horizontal drag past threshold dismisses with a
    // fling-out animation; below threshold the card snaps back.
    const panResponder = useRef<PanResponderInstance | null>(null);
    if (panResponder.current === null) {
        panResponder.current = PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 6 && Math.abs(gs.dx) > Math.abs(gs.dy),
            onPanResponderMove: (_, gs) => {
                translateX.setValue(gs.dx);
            },
            onPanResponderRelease: (_, gs) => {
                if (Math.abs(gs.dx) > SWIPE_DISMISS_THRESHOLD) {
                    Animated.parallel([
                        Animated.timing(translateX, {
                            toValue: gs.dx > 0 ? 400 : -400,
                            duration: 180,
                            useNativeDriver: true,
                        }),
                        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
                    ]).start(() => store.dismiss(toast.id));
                } else {
                    Animated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 7 }).start();
                }
            },
            onPanResponderTerminate: () => {
                Animated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 7 }).start();
            },
        });
    }

    return (
        <Animated.View
            accessibilityRole="alert"
            accessibilityLiveRegion={tone === 'danger' || tone === 'warning' ? 'assertive' : 'polite'}
            style={[
                styles.card,
                {
                    backgroundColor: tonePalette.bg,
                    borderColor: colors.semantic.border.default,
                    borderLeftColor: tonePalette.accent,
                    borderLeftWidth: richColors ? 0 : 3,
                    opacity,
                    transform: [{ translateX }, { translateY: enterY }],
                },
            ]}
            {...(panResponder.current?.panHandlers ?? {})}
        >
            {toast.icon ? <View style={styles.icon}>{toast.icon}</View> : null}
            <View style={styles.body}>
                <RNText
                    style={{
                        color: tonePalette.fg,
                        fontFamily: colors.fontFamily.body,
                        fontSize: 15,
                        fontWeight: '600',
                    }}
                >
                    {toast.title}
                </RNText>
                {toast.description ? (
                    <RNText
                        style={{
                            color: tonePalette.fg,
                            opacity: 0.8,
                            fontFamily: colors.fontFamily.body,
                            fontSize: 13,
                            marginTop: 2,
                        }}
                    >
                        {toast.description}
                    </RNText>
                ) : null}
                {toast.action || toast.cancel ? (
                    <View style={styles.actions}>
                        {toast.action ? (
                            <Pressable
                                onPress={() => {
                                    toast.action?.onClick();
                                    store.dismiss(toast.id);
                                }}
                                accessibilityRole="button"
                            >
                                <RNText
                                    style={{
                                        color: tonePalette.fg,
                                        fontFamily: colors.fontFamily.body,
                                        fontSize: 13,
                                        fontWeight: '600',
                                    }}
                                >
                                    {toast.action.label}
                                </RNText>
                            </Pressable>
                        ) : null}
                        {toast.cancel ? (
                            <Pressable
                                onPress={() => {
                                    toast.cancel?.onClick();
                                    store.dismiss(toast.id);
                                }}
                                accessibilityRole="button"
                            >
                                <RNText
                                    style={{
                                        color: tonePalette.fg,
                                        opacity: 0.7,
                                        fontFamily: colors.fontFamily.body,
                                        fontSize: 13,
                                    }}
                                >
                                    {toast.cancel.label}
                                </RNText>
                            </Pressable>
                        ) : null}
                    </View>
                ) : null}
            </View>
            {closeButton ? (
                <Pressable
                    onPress={() => store.dismiss(toast.id)}
                    accessibilityRole="button"
                    accessibilityLabel="Dismiss notification"
                    style={styles.close}
                >
                    <RNText style={{ color: tonePalette.fg, fontSize: 16, lineHeight: 16 }}>×</RNText>
                </Pressable>
            ) : null}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        minWidth: 280,
        maxWidth: 380,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth,
        // Drop shadow — RN's `elevation` covers Android, `shadow*` covers iOS.
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    icon: {
        marginTop: 1,
    },
    body: {
        flex: 1,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    close: {
        marginLeft: 6,
        padding: 4,
    },
});
