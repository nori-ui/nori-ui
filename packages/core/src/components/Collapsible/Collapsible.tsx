'use client';

import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from 'react';
import type { ViewStyle } from 'react-native';
import { Platform, Pressable, Text as RNText, View } from 'react-native';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type CollapsibleContextValue = {
    open: boolean;
    toggle: () => void;
    contentId: string;
    triggerId: string;
};

const CollapsibleContext = createContext<CollapsibleContextValue | null>(null);

const useCollapsibleContext = (label: string): CollapsibleContextValue => {
    const ctx = useContext(CollapsibleContext);
    if (!ctx) {
        throw new Error(`<${label}> must be rendered inside a <Collapsible>.`);
    }
    return ctx;
};

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export type CollapsibleProps = {
    /** Controlled open state. */
    open?: boolean;
    /** Uncontrolled initial open state. @defaultValue false */
    defaultOpen?: boolean;
    /** Fires when the open state changes. */
    onOpenChange?: (open: boolean) => void;
    children?: ReactNode;
    className?: string;
    testID?: string;
};

const CollapsibleRoot = ({
    open: controlledOpen,
    defaultOpen = false,
    onOpenChange,
    children,
    className,
    testID,
}: CollapsibleProps) => {
    const baseId = useId();
    const [innerOpen, setInnerOpen] = useState(defaultOpen);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : innerOpen;

    const toggle = useCallback(() => {
        const next = !open;
        if (!isControlled) {
            setInnerOpen(next);
        }
        onOpenChange?.(next);
    }, [open, isControlled, onOpenChange]);

    const ctx = useMemo<CollapsibleContextValue>(
        () => ({
            open,
            toggle,
            contentId: `${baseId}-content`,
            triggerId: `${baseId}-trigger`,
        }),
        [open, toggle, baseId]
    );

    return (
        <CollapsibleContext.Provider value={ctx}>
            <View
                {...(testID !== undefined ? { testID } : {})}
                className={cn('flex-col', className)}
                style={{ flexDirection: 'column' }}
            >
                {children}
            </View>
        </CollapsibleContext.Provider>
    );
};

// ---------------------------------------------------------------------------
// Trigger
// ---------------------------------------------------------------------------

export type CollapsibleTriggerProps = {
    children?: ReactNode;
    className?: string;
    testID?: string;
};

const CollapsibleTrigger = ({ children, className, testID }: CollapsibleTriggerProps) => {
    const { open, toggle, contentId, triggerId } = useCollapsibleContext('Collapsible.Trigger');
    const colors = useThemeColors();

    const triggerStyle: ViewStyle = {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: px(colors.spacing['2']),
        paddingHorizontal: px(colors.spacing['1']),
    };

    return (
        <Pressable
            id={triggerId}
            {...(testID !== undefined ? { testID } : {})}
            role="button"
            accessibilityRole="button"
            aria-expanded={open}
            aria-controls={contentId}
            onPress={toggle}
            className={cn('flex-row items-center py-2 px-1', className)}
            style={triggerStyle}
        >
            {typeof children === 'string' ? (
                <RNText
                    style={{
                        color: colors.semantic.text.default,
                        fontFamily: colors.fontFamily.body,
                        fontSize: px(colors.fontSize.sm),
                        fontWeight: colors.fontWeight.medium as '500',
                    }}
                >
                    {children}
                </RNText>
            ) : (
                children
            )}
        </Pressable>
    );
};

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export type CollapsibleContentProps = {
    children?: ReactNode;
    className?: string;
    testID?: string;
};

const CollapsibleContent = ({ children, className, testID }: CollapsibleContentProps) => {
    const { open, contentId, triggerId } = useCollapsibleContext('Collapsible.Content');
    const wrapperRef = useRef<HTMLElement | null>(null);
    const innerRef = useRef<HTMLElement | null>(null);

    // Web: animate max-height via CSS transition for smooth open/close.
    useEffect(() => {
        if (Platform.OS !== 'web') {
            return;
        }
        const wrapper = wrapperRef.current;
        const inner = innerRef.current;
        if (!wrapper || !inner) {
            return;
        }

        const isFirstPaint = wrapper.dataset.noriPainted !== '1';
        wrapper.dataset.noriPainted = '1';

        wrapper.style.overflow = 'hidden';
        wrapper.style.transitionProperty = 'max-height, opacity';
        wrapper.style.transitionDuration = '200ms';
        wrapper.style.transitionTimingFunction = 'cubic-bezier(0.16, 1, 0.3, 1)';

        if (open) {
            const target = inner.scrollHeight;
            if (isFirstPaint) {
                wrapper.style.maxHeight = `${target}px`;
                wrapper.style.opacity = '1';
                return;
            }
            wrapper.style.maxHeight = '0px';
            wrapper.style.opacity = '0';
            void wrapper.offsetHeight;
            requestAnimationFrame(() => {
                wrapper.style.maxHeight = `${target}px`;
                wrapper.style.opacity = '1';
            });
        } else {
            if (isFirstPaint) {
                wrapper.style.maxHeight = '0px';
                wrapper.style.opacity = '0';
                return;
            }
            const current = inner.scrollHeight;
            wrapper.style.maxHeight = `${current}px`;
            wrapper.style.opacity = '1';
            void wrapper.offsetHeight;
            requestAnimationFrame(() => {
                wrapper.style.maxHeight = '0px';
                wrapper.style.opacity = '0';
            });
        }
    }, [open]);

    // Native: just toggle visibility. Animation deferred to v2.
    if (Platform.OS !== 'web') {
        if (!open) {
            return null;
        }
        return (
            <View
                {...(testID !== undefined ? { testID } : {})}
                id={contentId}
                aria-labelledby={triggerId}
                className={cn('flex-col', className)}
                style={{ flexDirection: 'column' }}
            >
                {children}
            </View>
        );
    }

    return (
        <View
            ref={(node: unknown) => {
                wrapperRef.current = node as HTMLElement | null;
            }}
            {...(testID !== undefined ? { testID } : {})}
            id={contentId}
            aria-labelledby={triggerId}
            aria-hidden={!open}
            className={cn('overflow-hidden', className)}
        >
            <View
                ref={(node: unknown) => {
                    innerRef.current = node as HTMLElement | null;
                }}
                className="flex-col"
                style={{ flexDirection: 'column' }}
            >
                {children}
            </View>
        </View>
    );
};

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

/**
 * Single open/close disclosure. Compose with `Collapsible.Trigger` and
 * `Collapsible.Content`:
 *
 * ```tsx
 * <Collapsible>
 *   <Collapsible.Trigger>Show details</Collapsible.Trigger>
 *   <Collapsible.Content>
 *     <Text>Hidden until the trigger is pressed.</Text>
 *   </Collapsible.Content>
 * </Collapsible>
 * ```
 *
 * Controlled usage: pass `open` + `onOpenChange`. Uncontrolled: pass
 * `defaultOpen` (or neither for closed-by-default).
 *
 * On web, `Content` animates via a CSS max-height / opacity transition
 * (200ms). On native, the content mounts/unmounts immediately — animated
 * height transition is a v2 follow-up.
 */
export const Collapsible = Object.assign(CollapsibleRoot, {
    Trigger: CollapsibleTrigger,
    Content: CollapsibleContent,
});
