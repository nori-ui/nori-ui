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
import { cn } from '../../utils/cn';

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
    children,
    className,
    testID,
}: CarouselProps) => {
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

    const scrollTo = useCallback(
        (idx: number) => {
            const list = listRef.current;
            if (!list) {
                return;
            }
            const item = list.children[idx] as HTMLElement | undefined;
            if (!item) {
                return;
            }
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            setIndex(idx);
        },
        [setIndex]
    );

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

    // Keep index in sync if external scroll happens
    useEffect(() => {
        const list = listRef.current;
        if (!list) {
            return;
        }
        const handleScroll = () => {
            const { scrollLeft, scrollTop, offsetWidth, offsetHeight } = list;
            const pos = orientation === 'horizontal' ? scrollLeft : scrollTop;
            const size = orientation === 'horizontal' ? offsetWidth : offsetHeight;
            if (size === 0) {
                return;
            }
            const newIdx = Math.round(pos / size);
            if (newIdx !== index) {
                setIndex(newIdx);
            }
        };
        list.addEventListener('scroll', handleScroll, { passive: true });
        return () => list.removeEventListener('scroll', handleScroll);
    }, [orientation, index, setIndex]);

    return (
        <CarouselContext.Provider
            value={{ index, count, loop, orientation, scrollTo, next, prev, listRef, setCount, id }}
        >
            <section
                aria-label={testID ?? 'Carousel'}
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
    const disabled = !ctx.loop && ctx.index === 0;
    return (
        <button
            type="button"
            aria-label="Previous slide"
            disabled={disabled}
            data-testid={testID}
            onClick={ctx.prev}
            className={cn(
                'absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow hover:bg-white disabled:opacity-40',
                className
            )}
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
    const disabled = !ctx.loop && ctx.index >= ctx.count - 1;
    return (
        <button
            type="button"
            aria-label="Next slide"
            disabled={disabled}
            data-testid={testID}
            onClick={ctx.next}
            className={cn(
                'absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow hover:bg-white disabled:opacity-40',
                className
            )}
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
    if (ctx.count === 0) {
        return null;
    }
    return (
        <div
            role="tablist"
            aria-label="Slide navigation"
            data-testid={testID}
            className={cn('absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5', className)}
        >
            {Array.from({ length: ctx.count }, (_, i) => (
                <button
                    // biome-ignore lint/suspicious/noArrayIndexKey: dot index IS its stable identity
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={i === ctx.index}
                    aria-label={`Go to slide ${i + 1}`}
                    onClick={() => ctx.scrollTo(i)}
                    className={cn(
                        'h-1.5 w-1.5 rounded-full transition-all',
                        i === ctx.index ? 'w-3 bg-white' : 'bg-white/50 hover:bg-white/75'
                    )}
                />
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
