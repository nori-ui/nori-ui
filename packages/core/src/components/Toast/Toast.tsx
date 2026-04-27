'use client';

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ViewStyle } from 'react-native';
import { Platform, Pressable, Text as RNText, View } from 'react-native';
import { defaultSemanticIcons } from '../../icons/default-semantic-icons';
import { px } from '../../theme/px';
import { useColorScheme } from '../../theme/use-color-scheme';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

export type ToastAction = {
    label: string;
    onPress: () => void;
};

export type ToastOptions = {
    /** Bolded heading line. */
    title: string;
    /** Body text below the title. */
    description?: string;
    /**
     * Severity tone — drives the icon and accent color.
     * @defaultValue 'info'
     */
    tone?: ToastTone;
    /**
     * Auto-dismiss after this many milliseconds. Pass `Infinity` to keep
     * the toast open until the user dismisses it manually.
     * @defaultValue 5000
     */
    duration?: number;
    /** Optional action button — typically "Undo" or a navigation link. */
    action?: ToastAction;
};

type ActiveToast = ToastOptions & { id: string };

type ToastContextValue = {
    toasts: ReadonlyArray<ActiveToast>;
    toast: (options: ToastOptions) => string;
    dismiss: (id: string) => void;
    dismissAll: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Imperative toast notifications. Wrap your app (or the section that
 * needs toasts) in `<ToastProvider>`, then call `useToast().toast(...)`
 * from any descendant.
 *
 * The viewport renders bottom-right by default and stacks newest on top.
 * Each toast auto-dismisses after `duration` (default 5s); pass
 * `duration: Infinity` to require manual dismissal.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ActiveToast[]>([]);
    const idCounter = useRef(0);
    const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    const dismiss = useCallback((id: string) => {
        setToasts((cur) => cur.filter((t) => t.id !== id));
        const timer = timers.current.get(id);
        if (timer !== undefined) {
            clearTimeout(timer);
            timers.current.delete(id);
        }
    }, []);

    const toast = useCallback(
        (options: ToastOptions): string => {
            idCounter.current += 1;
            const id = `t-${idCounter.current}`;
            setToasts((cur) => [...cur, { ...options, id }]);
            const duration = options.duration ?? 5000;
            if (Number.isFinite(duration)) {
                const timer = setTimeout(() => dismiss(id), duration);
                timers.current.set(id, timer);
            }
            return id;
        },
        [dismiss]
    );

    const dismissAll = useCallback(() => {
        for (const timer of timers.current.values()) clearTimeout(timer);
        timers.current.clear();
        setToasts([]);
    }, []);

    // Clean up any pending timers on unmount.
    useEffect(() => {
        const map = timers.current;
        return () => {
            for (const timer of map.values()) clearTimeout(timer);
            map.clear();
        };
    }, []);

    const value = useMemo<ToastContextValue>(
        () => ({ toasts, toast, dismiss, dismissAll }),
        [toasts, toast, dismiss, dismissAll]
    );

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastViewport toasts={toasts} dismiss={dismiss} />
        </ToastContext.Provider>
    );
}

/**
 * Returns `{ toast, dismiss, dismissAll }`. Throws when called outside a
 * `<ToastProvider>` so misuse is loud, not silent.
 */
export function useToast(): {
    toast: (options: ToastOptions) => string;
    dismiss: (id: string) => void;
    dismissAll: () => void;
} {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error('useToast() must be called inside a <ToastProvider>.');
    }
    return { toast: ctx.toast, dismiss: ctx.dismiss, dismissAll: ctx.dismissAll };
}

// Layout-only base; theme-driven dimensions are merged inside ToastViewport.
const VIEWPORT_LAYOUT_BASE: ViewStyle = {
    position: Platform.OS === 'web' ? ('fixed' as unknown as 'absolute') : 'absolute',
    flexDirection: 'column',
    alignItems: 'flex-end',
    pointerEvents: 'box-none',
    ...(Platform.OS === 'web' ? ({ zIndex: 60 } as ViewStyle) : {}),
};

type ViewportProps = {
    toasts: ReadonlyArray<ActiveToast>;
    dismiss: (id: string) => void;
};

function ToastViewport({ toasts, dismiss }: ViewportProps) {
    const colors = useThemeColors();
    if (toasts.length === 0) return null;
    const viewportStyle: ViewStyle = {
        ...VIEWPORT_LAYOUT_BASE,
        right: px(colors.spacing['4']),
        bottom: px(colors.spacing['4']),
        gap: px(colors.spacing['2']) + 2, // closest theme-rooted approximation of legacy 10
    };
    return (
        <View
            role="region"
            aria-label="Notifications"
            className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2.5"
            style={viewportStyle}
            pointerEvents="box-none"
        >
            {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
            ))}
        </View>
    );
}

type TonePaletteEntry = {
    bg: string;
    border: string;
    fg: string;
    iconColor: string;
    defaultIcon: typeof defaultSemanticIcons.info;
};

// The toast surface always uses the elevated semantic background — it sits
// over the app like a card. Only the border tinges on tone (success →
// green-200/700, danger → red-200/700, etc.). Reading from the active
// palette + scheme makes both the surface AND the tonal border flip with
// dark mode, so a danger toast doesn't keep a red-200 border on a #18181b
// card.
function tonePalettes(
    scheme: 'light' | 'dark',
    elevatedBg: string,
    fg: string,
    primary200: string,
    primary600: string,
    success: string,
    warning: string,
    danger: string
): Record<ToastTone, TonePaletteEntry> {
    const isDark = scheme === 'dark';
    return {
        info: {
            bg: elevatedBg,
            border: isDark ? '#0f766e' : primary200,
            fg,
            iconColor: primary600,
            defaultIcon: defaultSemanticIcons.info,
        },
        success: {
            bg: elevatedBg,
            border: isDark ? '#14532d' : '#bbf7d0',
            fg,
            iconColor: success,
            defaultIcon: defaultSemanticIcons.checkmark,
        },
        warning: {
            bg: elevatedBg,
            border: isDark ? '#78350f' : '#fde68a',
            fg,
            iconColor: warning,
            defaultIcon: defaultSemanticIcons.alertTriangle,
        },
        danger: {
            bg: elevatedBg,
            border: isDark ? '#7f1d1d' : '#fecaca',
            fg,
            iconColor: danger,
            defaultIcon: defaultSemanticIcons.alertTriangle,
        },
    };
}

// Layout / shadow only — theme-driven dimensions are merged inside ToastItem.
const TOAST_LAYOUT_BASE: ViewStyle = {
    minWidth: 320, // component-density literal — not from theme
    maxWidth: 420, // component-density literal — not from theme
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    ...(Platform.OS === 'web'
        ? ({
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
          } as ViewStyle)
        : { elevation: 8 }),
};

type ItemProps = {
    toast: ActiveToast;
    onDismiss: () => void;
};

function ToastItem({ toast, onDismiss }: ItemProps) {
    const colors = useThemeColors();
    const scheme = useColorScheme();
    // Slide-in: render at translateY(8px) + opacity 0 on the first paint,
    // then flip to translateY(0) + opacity 1 in a useEffect so the CSS
    // transition has a frame to interpolate. Web-only — RN's Animated
    // would also work but adds complexity; the snap on native is fine
    // because the platform's own transition primitives kick in there.
    const [entered, setEntered] = useState(Platform.OS !== 'web');
    useEffect(() => {
        if (Platform.OS !== 'web') return;
        const id = requestAnimationFrame(() => setEntered(true));
        return () => cancelAnimationFrame(id);
    }, []);
    const enterStyle: ViewStyle =
        Platform.OS === 'web'
            ? ({
                  opacity: entered ? 1 : 0,
                  transform: [{ translateY: entered ? 0 : 8 }],
                  transitionProperty: 'opacity, transform',
                  transitionDuration: '200ms',
                  transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              } as ViewStyle)
            : {};
    const palette = tonePalettes(
        scheme,
        colors.semantic.background.elevated,
        colors.semantic.text.default,
        colors.color.primary['200'],
        colors.color.primary['600'],
        colors.color.success,
        colors.color.warning,
        colors.color.danger
    )[toast.tone ?? 'info'];
    const IconComponent = palette.defaultIcon;
    const actionColor = scheme === 'dark' ? colors.color.primary['300'] : colors.color.primary['700'];
    const toastStyle: ViewStyle = {
        ...TOAST_LAYOUT_BASE,
        gap: px(colors.spacing['3']),
        padding: px(colors.spacing['3']), // closest theme-rooted approximation of legacy 14
        borderRadius: px(colors.radius.lg) + 2, // closest to legacy 10
    };
    return (
        <View
            role="status"
            accessibilityRole="alert"
            aria-live="polite"
            className={cn('rounded-lg border bg-semantic-background-elevated p-3.5')}
            style={[toastStyle, { backgroundColor: palette.bg, borderColor: palette.border }, enterStyle]}
            pointerEvents="auto"
        >
            <View
                aria-hidden={true}
                // 20px icon hit area — component-density literal — not from theme
                style={{ width: 20, marginTop: 2, alignItems: 'center', justifyContent: 'center' }}
            >
                <IconComponent size={20} color={palette.iconColor} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
                <RNText
                    style={{
                        color: palette.fg,
                        fontFamily: colors.fontFamily.body,
                        fontSize: px(colors.fontSize.sm),
                        fontWeight: colors.fontWeight.semibold as '600',
                        lineHeight: px(colors.fontSize.sm) * Number(colors.lineHeight.normal),
                    }}
                >
                    {toast.title}
                </RNText>
                {toast.description !== undefined ? (
                    <RNText
                        style={{
                            color: colors.semantic.text.muted,
                            fontFamily: colors.fontFamily.body,
                            fontSize: px(colors.fontSize.sm),
                            lineHeight: px(colors.fontSize.sm) * Number(colors.lineHeight.normal),
                        }}
                    >
                        {toast.description}
                    </RNText>
                ) : null}
                {toast.action !== undefined ? (
                    <Pressable
                        onPress={() => {
                            toast.action?.onPress();
                            onDismiss();
                        }}
                        role="button"
                        accessibilityRole="button"
                        accessibilityLabel={toast.action.label}
                        style={{ marginTop: px(colors.spacing['2']) - 2, alignSelf: 'flex-start' }}
                    >
                        <RNText
                            style={{
                                color: actionColor,
                                fontFamily: colors.fontFamily.body,
                                fontSize: px(colors.fontSize.sm),
                                fontWeight: colors.fontWeight.semibold as '600',
                            }}
                        >
                            {toast.action.label}
                        </RNText>
                    </Pressable>
                ) : null}
            </View>
            <Pressable
                onPress={onDismiss}
                role="button"
                accessibilityRole="button"
                accessibilityLabel="Dismiss notification"
                aria-label="Dismiss notification"
                style={{
                    // 24×24 close button hit area — component-density literal — not from theme
                    width: 24,
                    height: 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: px(colors.radius.sm),
                    marginTop: -2,
                }}
            >
                <defaultSemanticIcons.close size={16} color={colors.semantic.text.muted} />
            </Pressable>
        </View>
    );
}
