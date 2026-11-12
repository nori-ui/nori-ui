'use client';

import {
    Children,
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useId,
    useRef,
    useState,
} from 'react';
import { useTranslation } from '../../i18n/use-translation';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';

// A programmatic scroll counts as finished once no scroll event has arrived for this long.
const SCROLL_SETTLE_MS = 150;

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type CarouselContextValue = {
    index: number;
    count: number;
    loop: boolean;
    orientation: 'horizontal' | 'vertical';
    scrollTo: (idx: number) => void;
    next: () => void;
    prev: () => void;
    listRef: React.RefObject<HTMLDivElement | null>;
    setCount: (n: number) => void;
    id: string;
};

const CarouselContext = createContext<CarouselContextValue | null>(null);

function useCarouselContext(caller: string): CarouselContextValue {
    const ctx = useContext(CarouselContext);
    if (!ctx) {
        throw new Error(`<${caller}> must be rendered inside <Carousel>.`);
    }
    return ctx;
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export type CarouselProps = {
    /** Controlled current index. */
    index?: number;
    /** Initial index (uncontrolled). @defaultValue 0 */
    defaultIndex?: number;
    /** Fires with the new index. */
    onIndexChange?: (index: number) => void;
    /** Whether navigation wraps from last to first and vice-versa. @defaultValue false */
    loop?: boolean;
    /** Scroll axis. @defaultValue 'horizontal' */
    orientation?: 'horizontal' | 'vertical';
    /** Accessible name of the carousel region. Defaults to the i18n `carousel.label` string. */
    'aria-label'?: string;
    children?: ReactNode;
    className?: string;
    testID?: string;
};

const CarouselRoot = ({
    index: controlledIndex,
    defaultIndex = 0,
    onIndexChange,
    loop = false,
    orientation = 'horizontal',
    'aria-label': ariaLabel,
    children,
    className,
    testID,
}: CarouselProps) => {
    const { t } = useTranslation();
    const [inner, setInner] = useState(defaultIndex);
    const isControlled = controlledIndex !== undefined;
    const index = isControlled ? (controlledIndex as number) : inner;
    const [count, setCount] = useState(0);
    const listRef = useRef<HTMLDivElement | null>(null);
    const id = useId();

    const setIndex = useCallback(
        (next: number) => {
            if (!isControlled) {
                setInner(next);
            }
            onIndexChange?.(next);
        },
        [isControlled, onIndexChange]
    );

    // The scroll itself happens in the effect below, so that every index change
    // (button, dot, `defaultIndex`, a parent-driven `index`) moves the list the same way.
    const scrollTo = setIndex;

    const next = useCallback(() => {
        if (count === 0) {
            return;
        }
        if (index < count - 1) {
            scrollTo(index + 1);
        } else if (loop) {
            scrollTo(0);
        }
    }, [index, count, loop, scrollTo]);

    const prev = useCallback(() => {
        if (count === 0) {
            return;
        }
        if (index > 0) {
            scrollTo(index - 1);
        } else if (loop) {
            scrollTo(count - 1);
        }
    }, [index, count, loop, scrollTo]);

    const indexRef = useRef(index);
    indexRef.current = index;
    const setIndexRef = useRef(setIndex);
    setIndexRef.current = setIndex;
    // Index a programmatic scroll is heading for, or null when the list is at rest or the user is scrolling it.
    const programmaticTargetRef = useRef<number | null>(null);
    const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasPositionedRef = useRef(false);

    const readScrollIndex = useCallback((): number | null => {
        const list = listRef.current;
        if (!list) {
            return null;
        }
        const pos = orientation === 'horizontal' ? list.scrollLeft : list.scrollTop;
        const size = orientation === 'horizontal' ? list.offsetWidth : list.offsetHeight;
        if (size === 0) {
            return null;
        }
        return Math.round(pos / size);
    }, [orientation]);

    const armSettleTimer = useCallback(() => {
        if (settleTimerRef.current !== null) {
            clearTimeout(settleTimerRef.current);
        }
        settleTimerRef.current = setTimeout(() => {
            settleTimerRef.current = null;
            programmaticTargetRef.current = null;
            // The user may have grabbed the list mid-animation; adopt wherever it came to rest.
            const settled = readScrollIndex();
            if (settled !== null && settled !== indexRef.current) {
                setIndexRef.current(settled);
            }
        }, SCROLL_SETTLE_MS);
    }, [readScrollIndex]);

    // Move the list to the current index. `count` is a dependency because the
    // slides may mount after the first index is known.
    // biome-ignore lint/correctness/useExhaustiveDependencies: count re-runs the effect once slides exist
    useEffect(() => {
        const list = listRef.current;
        if (!list || index < 0 || index >= list.children.length) {
            return;
        }
        const current = readScrollIndex();
        // A list without a size (hidden, not laid out yet) cannot be positioned.
        if (current === null) {
            return;
        }
        if (current === index) {
            hasPositionedRef.current = true;
            return;
        }
        const horizontal = orientation === 'horizontal';
        const offset = index * (horizontal ? list.offsetWidth : list.offsetHeight);
        // The first positioning (`defaultIndex`) must not animate from slide 0.
        const behavior: ScrollBehavior = hasPositionedRef.current ? 'smooth' : 'instant';
        hasPositionedRef.current = true;
        programmaticTargetRef.current = index;
        // Scrolls the list itself; `scrollIntoView` would also scroll the page to the carousel.
        if (typeof list.scrollTo === 'function') {
            list.scrollTo(horizontal ? { left: offset, behavior } : { top: offset, behavior });
        } else if (horizontal) {
            list.scrollLeft = offset;
        } else {
            list.scrollTop = offset;
        }
        armSettleTimer();
    }, [index, count, orientation, readScrollIndex, armSettleTimer]);

    // Follow the user's own scrolling (swipe, trackpad, keyboard).
    useEffect(() => {
        const list = listRef.current;
        if (!list) {
            return;
        }
        const handleScroll = () => {
            // A smooth programmatic scroll passes every slide on the way; reporting
            // those would fire `onIndexChange` with stale indexes and pull the index back.
            if (programmaticTargetRef.current !== null) {
                armSettleTimer();
                return;
            }
            const scrolled = readScrollIndex();
            if (scrolled !== null && scrolled !== indexRef.current) {
                setIndexRef.current(scrolled);
            }
        };
        list.addEventListener('scroll', handleScroll, { passive: true });
        return () => list.removeEventListener('scroll', handleScroll);
    }, [readScrollIndex, armSettleTimer]);

    useEffect(
        () => () => {
            if (settleTimerRef.current !== null) {
                clearTimeout(settleTimerRef.current);
            }
        },
        []
    );

    return (
        <CarouselContext.Provider
            value={{ index, count, loop, orientation, scrollTo, next, prev, listRef, setCount, id }}
        >
            <section
                aria-label={ariaLabel ?? t('carousel.label')}
                className={cn('relative overflow-hidden', className)}
                data-testid={testID}
            >
                {children}
            </section>
        </CarouselContext.Provider>
    );
};

// ---------------------------------------------------------------------------
// Content — the scroll container
// ---------------------------------------------------------------------------

export type CarouselContentProps = {
    children?: ReactNode;
    className?: string;
    testID?: string;
};

const CarouselContent = ({ children, className, testID }: CarouselContentProps) => {
    const ctx = useCarouselContext('Carousel.Content');

    // Count items
    const childCount = Children.count(children);
    useEffect(() => {
        ctx.setCount(childCount);
    }, [childCount, ctx.setCount]);

    const isHorizontal = ctx.orientation === 'horizontal';

    return (
        <div
            ref={ctx.listRef}
            data-testid={testID}
            className={cn(
                'flex',
                isHorizontal
                    ? 'flex-row overflow-x-auto overflow-y-hidden'
                    : 'flex-col overflow-y-auto overflow-x-hidden',
                className
            )}
            style={{
                scrollSnapType: isHorizontal ? 'x mandatory' : 'y mandatory',
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch',
                // Hide scrollbar
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
            }}
        >
            {children}
        </div>
    );
};

// ---------------------------------------------------------------------------
// Item
// ---------------------------------------------------------------------------

export type CarouselItemProps = {
    children?: ReactNode;
    className?: string;
    testID?: string;
};

const CarouselItem = ({ children, className, testID }: CarouselItemProps) => {
    const ctx = useCarouselContext('Carousel.Item');
    const isHorizontal = ctx.orientation === 'horizontal';
    return (
        <div
            data-testid={testID}
            className={cn('shrink-0', isHorizontal ? 'w-full' : 'h-full', className)}
            style={{
                scrollSnapAlign: 'start',
                minWidth: isHorizontal ? '100%' : undefined,
                minHeight: !isHorizontal ? '100%' : undefined,
            }}
        >
            {children}
        </div>
    );
};

// ---------------------------------------------------------------------------
// Previous / Next buttons
// ---------------------------------------------------------------------------

export type CarouselButtonProps = {
    className?: string;
    testID?: string;
    children?: ReactNode;
};

const CarouselPrevious = ({ className, testID, children }: CarouselButtonProps) => {
    const ctx = useCarouselContext('Carousel.Previous');
    const colors = useThemeColors();
    const { t } = useTranslation();
    const disabled = !ctx.loop && ctx.index === 0;
    return (
        <button
            type="button"
            aria-label={t('carousel.previous')}
            disabled={disabled}
            data-testid={testID}
            onClick={ctx.prev}
            className={cn(
                'absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full shadow disabled:opacity-40',
                className
            )}
            style={{ backgroundColor: colors.semantic.background.elevated, color: colors.semantic.text.default }}
        >
            {children ?? (
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="h-4 w-4"
                    aria-hidden="true"
                >
                    <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )}
        </button>
    );
};

const CarouselNext = ({ className, testID, children }: CarouselButtonProps) => {
    const ctx = useCarouselContext('Carousel.Next');
    const colors = useThemeColors();
    const { t } = useTranslation();
    const disabled = !ctx.loop && ctx.index >= ctx.count - 1;
    return (
        <button
            type="button"
            aria-label={t('carousel.next')}
            disabled={disabled}
            data-testid={testID}
            onClick={ctx.next}
            className={cn(
                'absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full shadow disabled:opacity-40',
                className
            )}
            style={{ backgroundColor: colors.semantic.background.elevated, color: colors.semantic.text.default }}
        >
            {children ?? (
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="h-4 w-4"
                    aria-hidden="true"
                >
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )}
        </button>
    );
};

// ---------------------------------------------------------------------------
// Dots
// ---------------------------------------------------------------------------

export type CarouselDotsProps = {
    className?: string;
    testID?: string;
};

const CarouselDots = ({ className, testID }: CarouselDotsProps) => {
    const ctx = useCarouselContext('Carousel.Dots');
    const colors = useThemeColors();
    const { t } = useTranslation();
    if (ctx.count === 0) {
        return null;
    }
    return (
        <div
            role="tablist"
            aria-label={t('carousel.dotsLabel')}
            data-testid={testID}
            className={cn('absolute bottom-1 left-0 right-0 flex items-center justify-center', className)}
        >
            {Array.from({ length: ctx.count }, (_, i) => (
                <button
                    // biome-ignore lint/suspicious/noArrayIndexKey: dot index IS its stable identity
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={i === ctx.index}
                    aria-label={t('carousel.goToSlide', { index: i + 1 })}
                    onClick={() => ctx.scrollTo(i)}
                    // The dot stays small; the button around it is the 24px target WCAG 2.2 asks for.
                    className="group flex h-6 min-w-6 items-center justify-center px-1.5"
                >
                    <span
                        aria-hidden="true"
                        className={cn(
                            'h-1.5 rounded-full transition-all',
                            i === ctx.index ? 'w-3' : 'w-1.5 opacity-50 group-hover:opacity-75'
                        )}
                        style={{ backgroundColor: colors.semantic.text.default }}
                    />
                </button>
            ))}
        </div>
    );
};

// ---------------------------------------------------------------------------
// Public compound export
// ---------------------------------------------------------------------------

/**
 * Paged horizontal (or vertical) slider with CSS scroll-snap.
 *
 * Composition:
 * - `Carousel.Content` — the scroll container
 * - `Carousel.Item` — each slide
 * - `Carousel.Previous` / `Carousel.Next` — navigation buttons
 * - `Carousel.Dots` — dot pagination indicators
 *
 * ```tsx
 * <Carousel>
 *   <Carousel.Content>
 *     <Carousel.Item><img src="a.jpg" /></Carousel.Item>
 *     <Carousel.Item><img src="b.jpg" /></Carousel.Item>
 *   </Carousel.Content>
 *   <Carousel.Previous />
 *   <Carousel.Next />
 *   <Carousel.Dots />
 * </Carousel>
 * ```
 */
export const Carousel = Object.assign(CarouselRoot, {
    Content: CarouselContent,
    Item: CarouselItem,
    Previous: CarouselPrevious,
    Next: CarouselNext,
    Dots: CarouselDots,
});
