'use client';

import {
    createContext,
    type ReactNode,
    type RefObject,
    useCallback,
    useContext,
    useId,
    useLayoutEffect,
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

const COLLAPSIBLE_ANIM_DURATION_MS = 200;

/**
 * Web-only open/close transition for a disclosure body that stays mounted.
 * Shared with `Accordion.Content`; not part of the public API.
 *
 * The styles are written to the DOM node directly because react-native-web's
 * style filter drops `transition*` keys. Three things matter beyond the
 * slide itself:
 *
 *  - A closed body is `inert` and `visibility: hidden`, so Tab never lands
 *    on controls nobody can see. `visibility` is part of the transition, so
 *    it only flips to `hidden` once the slide has finished.
 *  - The initial state is applied before the first paint and before the
 *    transition is installed, so a closed body never paints open and then
 *    animates shut.
 *  - Once open, `max-height` is released to `none` so content that grows
 *    later is not clipped at the height measured when it opened.
 */
export function useWebDisclosureTransition(
    open: boolean,
    wrapperRef: RefObject<HTMLElement | null>,
    durationMs: number
): void {
    useLayoutEffect(() => {
        if (Platform.OS !== 'web') {
            return undefined;
        }
        const wrapper = wrapperRef.current;
        if (!wrapper) {
            return undefined;
        }

        const applyClosed = () => {
            wrapper.style.maxHeight = '0px';
            wrapper.style.opacity = '0';
            wrapper.style.visibility = 'hidden';
            wrapper.setAttribute('inert', '');
        };

        const isFirstPaint = wrapper.dataset.noriPainted !== '1';
        wrapper.dataset.noriPainted = '1';
        wrapper.style.overflow = 'hidden';

        if (isFirstPaint) {
            if (open) {
                wrapper.style.maxHeight = 'none';
                wrapper.style.opacity = '1';
                wrapper.style.visibility = 'visible';
            } else {
                applyClosed();
            }
            // Commit the initial state before the transition exists, so
            // server-rendered markup does not animate into it on hydration.
            void wrapper.offsetHeight;
            wrapper.style.transitionProperty = 'max-height, opacity, visibility';
            wrapper.style.transitionDuration = `${durationMs}ms`;
            wrapper.style.transitionTimingFunction = 'cubic-bezier(0.16, 1, 0.3, 1)';
            return undefined;
        }

        if (open) {
            wrapper.removeAttribute('inert');
            wrapper.style.visibility = 'visible';
            wrapper.style.maxHeight = `${wrapper.scrollHeight}px`;
            wrapper.style.opacity = '1';
            const release = setTimeout(() => {
                wrapper.style.maxHeight = 'none';
            }, durationMs);
            return () => clearTimeout(release);
        }

        // `none` does not transition, so pin the current pixel height first.
        wrapper.style.maxHeight = `${wrapper.offsetHeight}px`;
        void wrapper.offsetHeight;
        applyClosed();
        return undefined;
    }, [open, wrapperRef, durationMs]);
}

export type CollapsibleContentProps = {
    children?: ReactNode;
    className?: string;
    testID?: string;
};

const CollapsibleContent = ({ children, className, testID }: CollapsibleContentProps) => {
    const { open, contentId, triggerId } = useCollapsibleContext('Collapsible.Content');
    const wrapperRef = useRef<HTMLElement | null>(null);
    useWebDisclosureTransition(open, wrapperRef, COLLAPSIBLE_ANIM_DURATION_MS);

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
            <View className="flex-col" style={{ flexDirection: 'column' }}>
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
