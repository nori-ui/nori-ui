'use client';

import {
    createContext,
    isValidElement,
    type ReactElement,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useId,
    useRef,
    useState,
} from 'react';
import { Slot } from '../../slot';
import type { PopoverAlign, PopoverSide } from '../Popover/Popover';
import { Popover } from '../Popover/Popover';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type HoverCardContextValue = {
    open: boolean;
    requestOpen: () => void;
    requestClose: () => void;
    cancelTimers: () => void;
    contentId: string;
};

const HoverCardContext = createContext<HoverCardContextValue | null>(null);

function useHoverCardContext(caller: string): HoverCardContextValue {
    const ctx = useContext(HoverCardContext);
    if (!ctx) {
        throw new Error(`<${caller}> must be rendered inside <HoverCard>.`);
    }
    return ctx;
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

const DEFAULT_OPEN_DELAY = 300;
const DEFAULT_CLOSE_DELAY = 200;

export type HoverCardProps = {
    /** Controlled open state. */
    open?: boolean;
    /** Uncontrolled initial open state. @defaultValue false */
    defaultOpen?: boolean;
    /** Fires with the new open state. */
    onOpenChange?: (open: boolean) => void;
    /**
     * Milliseconds before the card opens after hover-in.
     * @defaultValue 300
     */
    openDelay?: number;
    /**
     * Milliseconds before the card closes after hover-out.
     * @defaultValue 200
     */
    closeDelay?: number;
    children?: ReactNode;
};

const HoverCardRoot = ({
    open: controlledOpen,
    defaultOpen = false,
    onOpenChange,
    openDelay = DEFAULT_OPEN_DELAY,
    closeDelay = DEFAULT_CLOSE_DELAY,
    children,
}: HoverCardProps) => {
    const [inner, setInner] = useState(defaultOpen);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? (controlledOpen as boolean) : inner;
    const id = useId();

    const setOpen = useCallback(
        (next: boolean) => {
            if (!isControlled) {
                setInner(next);
            }
            onOpenChange?.(next);
        },
        [isControlled, onOpenChange]
    );

    const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const cancelTimers = useCallback(() => {
        if (openTimer.current) {
            clearTimeout(openTimer.current);
            openTimer.current = null;
        }
        if (closeTimer.current) {
            clearTimeout(closeTimer.current);
            closeTimer.current = null;
        }
    }, []);

    const requestOpen = useCallback(() => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current);
            closeTimer.current = null;
        }
        if (openTimer.current) {
            return;
        }
        if (openDelay <= 0) {
            setOpen(true);
            return;
        }
        openTimer.current = setTimeout(() => {
            openTimer.current = null;
            setOpen(true);
        }, openDelay);
    }, [openDelay, setOpen]);

    const requestClose = useCallback(() => {
        if (openTimer.current) {
            clearTimeout(openTimer.current);
            openTimer.current = null;
        }
        if (closeTimer.current) {
            return;
        }
        if (closeDelay <= 0) {
            setOpen(false);
            return;
        }
        closeTimer.current = setTimeout(() => {
            closeTimer.current = null;
            setOpen(false);
        }, closeDelay);
    }, [closeDelay, setOpen]);

    useEffect(() => () => cancelTimers(), [cancelTimers]);

    return (
        <HoverCardContext.Provider
            value={{ open, requestOpen, requestClose, cancelTimers, contentId: `hc-content-${id}` }}
        >
            <Popover open={open} onOpenChange={setOpen}>
                {children}
            </Popover>
        </HoverCardContext.Provider>
    );
};

// ---------------------------------------------------------------------------
// Trigger
// ---------------------------------------------------------------------------

export type HoverCardTriggerProps = {
    /** Use the child element as the trigger instead of wrapping it. @defaultValue true */
    asChild?: boolean;
    children?: ReactNode;
    className?: string;
    testID?: string;
};

const HoverCardTrigger = ({ asChild = true, children, className, testID }: HoverCardTriggerProps) => {
    const ctx = useHoverCardContext('HoverCard.Trigger');

    const handleMouseEnter = useCallback(() => {
        ctx.cancelTimers();
        ctx.requestOpen();
    }, [ctx]);

    const handleMouseLeave = useCallback(() => {
        ctx.requestClose();
    }, [ctx]);

    const handlers = {
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        'aria-haspopup': 'dialog' as const,
        'aria-expanded': ctx.open,
    };

    if (asChild && isValidElement(children)) {
        const child = children as ReactElement<Record<string, unknown>>;
        const compose =
            <T,>(existing: ((e: T) => void) | undefined, next: (e: T) => void) =>
            (event: T) => {
                existing?.(event);
                next(event);
            };
        return (
            <Slot
                {...handlers}
                onMouseEnter={compose(child.props.onMouseEnter as ((e: unknown) => void) | undefined, handleMouseEnter)}
                onMouseLeave={compose(child.props.onMouseLeave as ((e: unknown) => void) | undefined, handleMouseLeave)}
                {...(className !== undefined ? { className } : {})}
                {...(testID !== undefined ? { 'data-testid': testID } : {})}
            >
                {child}
            </Slot>
        );
    }

    return (
        <span {...handlers} className={className} {...(testID !== undefined ? { 'data-testid': testID } : {})}>
            {children}
        </span>
    );
};

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export type HoverCardContentProps = {
    /** Which side of the trigger to render on. @defaultValue 'bottom' */
    side?: PopoverSide;
    /** Alignment along the trigger edge. @defaultValue 'start' */
    align?: PopoverAlign;
    children?: ReactNode;
    className?: string;
    testID?: string;
};

const HoverCardContent = ({ side = 'bottom', align = 'start', children, className, testID }: HoverCardContentProps) => {
    const ctx = useHoverCardContext('HoverCard.Content');

    // Keep hover card open while hovering over content itself
    const handleMouseEnter = useCallback(() => {
        ctx.cancelTimers();
    }, [ctx]);

    const handleMouseLeave = useCallback(() => {
        ctx.requestClose();
    }, [ctx]);

    return (
        <Popover.Content
            side={side}
            align={align}
            {...(className !== undefined ? { className } : {})}
            {...(testID !== undefined ? { testID } : {})}
        >
            {/* Intercept mouse events on the content surface so hovering
                over it cancels the close timer. */}
            <div
                id={ctx.contentId}
                role="dialog"
                aria-label="Hover card"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {children}
            </div>
        </Popover.Content>
    );
};

// ---------------------------------------------------------------------------
// Public compound export
// ---------------------------------------------------------------------------

/**
 * Hover-triggered popover card. Web only.
 *
 * On native, `HoverCard.Content` is omitted — only the trigger renders.
 * See `HoverCard.native.tsx`.
 *
 * Composition:
 * - `HoverCard.Trigger` — wraps any element; hover opens the card.
 * - `HoverCard.Content` — the floating card surface.
 *
 * ```tsx
 * <HoverCard>
 *   <HoverCard.Trigger>
 *     <Avatar src="..." />
 *   </HoverCard.Trigger>
 *   <HoverCard.Content>
 *     <Text>@manuelbieh — Senior dev at Wiremore</Text>
 *   </HoverCard.Content>
 * </HoverCard>
 * ```
 */
export const HoverCard = Object.assign(HoverCardRoot, {
    Trigger: HoverCardTrigger,
    Content: HoverCardContent,
});
