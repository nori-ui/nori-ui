'use client';

import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
    FlatList,
    type FlatListProps,
    Pressable,
    StyleSheet,
    useWindowDimensions,
    View,
    type ViewToken,
} from 'react-native';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type CarouselContextValue = {
    index: number;
    count: number;
    loop: boolean;
    scrollToIndex: (idx: number) => void;
    next: () => void;
    prev: () => void;
    flatListRef: React.RefObject<FlatList<unknown> | null>;
    setCount: (n: number) => void;
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
    index?: number;
    defaultIndex?: number;
    onIndexChange?: (index: number) => void;
    loop?: boolean;
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
    children,
    testID,
}: CarouselProps) => {
    const [inner, setInner] = useState(defaultIndex);
    const isControlled = controlledIndex !== undefined;
    const index = isControlled ? (controlledIndex as number) : inner;
    const [count, setCount] = useState(0);
    const flatListRef = useRef<FlatList<unknown> | null>(null);

    const setIndex = useCallback(
        (next: number) => {
            if (!isControlled) {
                setInner(next);
            }
            onIndexChange?.(next);
        },
        [isControlled, onIndexChange]
    );

    const scrollToIndex = useCallback(
        (idx: number) => {
            flatListRef.current?.scrollToIndex({ index: idx, animated: true });
            setIndex(idx);
        },
        [setIndex]
    );

    const next = useCallback(() => {
        if (count === 0) {
            return;
        }
        if (index < count - 1) {
            scrollToIndex(index + 1);
        } else if (loop) {
            scrollToIndex(0);
        }
    }, [index, count, loop, scrollToIndex]);

    const prev = useCallback(() => {
        if (count === 0) {
            return;
        }
        if (index > 0) {
            scrollToIndex(index - 1);
        } else if (loop) {
            scrollToIndex(count - 1);
        }
    }, [index, count, loop, scrollToIndex]);

    return (
        <CarouselContext.Provider value={{ index, count, loop, scrollToIndex, next, prev, flatListRef, setCount }}>
            <View testID={testID} className={cn('relative overflow-hidden')} style={styles.root}>
                {children}
            </View>
        </CarouselContext.Provider>
    );
};

// ---------------------------------------------------------------------------
// Content — wraps a FlatList with pagingEnabled
// ---------------------------------------------------------------------------

export type CarouselContentProps = {
    children?: ReactNode;
    className?: string;
    testID?: string;
};

const CarouselContent = ({ children, testID }: CarouselContentProps) => {
    const ctx = useCarouselContext('Carousel.Content');
    const { width } = useWindowDimensions();
    const items = Array.isArray(children) ? children : children ? [children] : [];

    const onViewableItemsChanged = useCallback(
        ({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
            const first = viewableItems[0];
            if (first && first.index !== null) {
                ctx.setCount(items.length);
            }
        },
        [ctx.setCount, items.length]
    );

    // Keep count in sync with items (runs after every render where items.length changes)
    useEffect(() => {
        ctx.setCount(items.length);
    }, [items.length, ctx.setCount]);

    const renderItem: FlatListProps<ReactNode>['renderItem'] = ({ item }) => (
        <View style={{ width }}>{item as ReactNode}</View>
    );

    return (
        <FlatList
            ref={ctx.flatListRef as React.RefObject<FlatList<ReactNode>>}
            data={items as ReactNode[]}
            renderItem={renderItem}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            testID={testID}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        />
    );
};

// ---------------------------------------------------------------------------
// Item — just a wrapper (children are unwrapped and wrapped by FlatList)
// ---------------------------------------------------------------------------

export type CarouselItemProps = {
    children?: ReactNode;
    className?: string;
    testID?: string;
};

// On native, CarouselItem is a pass-through — FlatList wraps children directly.
const CarouselItem = ({ children, testID }: CarouselItemProps) => (
    <View testID={testID} style={styles.item}>
        {children}
    </View>
);

// ---------------------------------------------------------------------------
// Previous / Next buttons
// ---------------------------------------------------------------------------

export type CarouselButtonProps = {
    className?: string;
    testID?: string;
    children?: ReactNode;
};

const CarouselPrevious = ({ testID, children }: CarouselButtonProps) => {
    const ctx = useCarouselContext('Carousel.Previous');
    const colors = useThemeColors();
    const disabled = !ctx.loop && ctx.index === 0;
    return (
        <Pressable
            accessibilityLabel="Previous slide"
            accessibilityRole="button"
            disabled={disabled}
            testID={testID}
            onPress={ctx.prev}
            style={[
                styles.navBtn,
                styles.navBtnLeft,
                { opacity: disabled ? 0.4 : 1, backgroundColor: colors.semantic.background.elevated },
            ]}
        >
            {children}
        </Pressable>
    );
};

const CarouselNext = ({ testID, children }: CarouselButtonProps) => {
    const ctx = useCarouselContext('Carousel.Next');
    const colors = useThemeColors();
    const disabled = !ctx.loop && ctx.index >= ctx.count - 1;
    return (
        <Pressable
            accessibilityLabel="Next slide"
            accessibilityRole="button"
            disabled={disabled}
            testID={testID}
            onPress={ctx.next}
            style={[
                styles.navBtn,
                styles.navBtnRight,
                { opacity: disabled ? 0.4 : 1, backgroundColor: colors.semantic.background.elevated },
            ]}
        >
            {children}
        </Pressable>
    );
};

// ---------------------------------------------------------------------------
// Dots
// ---------------------------------------------------------------------------

export type CarouselDotsProps = {
    className?: string;
    testID?: string;
};

const CarouselDots = ({ testID }: CarouselDotsProps) => {
    const ctx = useCarouselContext('Carousel.Dots');
    if (ctx.count === 0) {
        return null;
    }
    return (
        <View testID={testID} style={styles.dotsRow} accessibilityRole="tablist">
            {Array.from({ length: ctx.count }, (_, i) => (
                <Pressable
                    // biome-ignore lint/suspicious/noArrayIndexKey: dot index IS its stable identity
                    key={i}
                    onPress={() => ctx.scrollToIndex(i)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: i === ctx.index }}
                    accessibilityLabel={`Go to slide ${i + 1}`}
                    style={[styles.dot, i === ctx.index ? styles.dotActive : styles.dotInactive]}
                />
            ))}
        </View>
    );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
    root: {
        position: 'relative',
    },
    item: {
        flex: 1,
    },
    navBtn: {
        position: 'absolute',
        top: '50%',
        zIndex: 10,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    navBtnLeft: {
        left: 8,
    },
    navBtnRight: {
        right: 8,
    },
    dotsRow: {
        position: 'absolute',
        bottom: 12,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        height: 6,
        borderRadius: 3,
    },
    dotActive: {
        width: 12,
        backgroundColor: 'white',
    },
    dotInactive: {
        width: 6,
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
});

// ---------------------------------------------------------------------------
// Public compound export
// ---------------------------------------------------------------------------

export const Carousel = Object.assign(CarouselRoot, {
    Content: CarouselContent,
    Item: CarouselItem,
    Previous: CarouselPrevious,
    Next: CarouselNext,
    Dots: CarouselDots,
});
