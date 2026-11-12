'use client';

import { Children, createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
    FlatList,
    type FlatListProps,
    type LayoutChangeEvent,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
    Pressable,
    Text as RNText,
    StyleSheet,
    useWindowDimensions,
    View,
} from 'react-native';
import { useTranslation } from '../../i18n/use-translation';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type CarouselContextValue = {
    index: number;
    count: number;
    loop: boolean;
    orientation: 'horizontal' | 'vertical';
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
    /** Accessible name of the carousel. Defaults to the i18n `carousel.label` string. */
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

    // `Carousel.Content` scrolls the list whenever the index changes, so buttons,
    // dots, `defaultIndex` and a parent-driven `index` all move it the same way.
    const scrollToIndex = setIndex;

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
        <CarouselContext.Provider
            value={{ index, count, loop, orientation, scrollToIndex, next, prev, flatListRef, setCount }}
        >
            <View
                testID={testID}
                accessibilityLabel={ariaLabel ?? t('carousel.label')}
                className={cn('relative overflow-hidden', className)}
                style={styles.root}
            >
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

const CarouselContent = ({ children, className, testID }: CarouselContentProps) => {
    const ctx = useCarouselContext('Carousel.Content');
    const { index, orientation, flatListRef, setCount, scrollToIndex } = ctx;
    const horizontal = orientation === 'horizontal';
    const windowSize = useWindowDimensions();
    // Slides are as large as this container, not the window: inside a padded
    // parent a window-sized page would drift further off with every swipe.
    const [measured, setMeasured] = useState<number | null>(null);
    const pageSize = measured ?? (horizontal ? windowSize.width : windowSize.height);
    const items = Children.toArray(children);
    const itemCount = items.length;

    useEffect(() => {
        setCount(itemCount);
    }, [itemCount, setCount]);

    const handleLayout = (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        const next = horizontal ? width : height;
        if (next > 0) {
            setMeasured(next);
        }
    };

    // Where the list currently rests. Lets the effect below tell an index change
    // that still needs a scroll from one that a swipe has already performed.
    const positionRef = useRef<{ index: number; pageSize: number } | null>(null);

    useEffect(() => {
        if (index < 0 || index >= itemCount) {
            return;
        }
        const position = positionRef.current;
        if (position !== null && position.index === index && position.pageSize === pageSize) {
            return;
        }
        // Animate only a real index change; the first positioning and a resize should jump.
        const animated = position !== null && position.pageSize === pageSize;
        positionRef.current = { index, pageSize };
        flatListRef.current?.scrollToOffset({ offset: index * pageSize, animated });
    }, [index, itemCount, pageSize, flatListRef]);

    const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { x, y } = event.nativeEvent.contentOffset;
        const settled = Math.max(0, Math.min(itemCount - 1, Math.round((horizontal ? x : y) / pageSize)));
        positionRef.current = { index: settled, pageSize };
        if (settled !== index) {
            scrollToIndex(settled);
        }
    };

    const renderItem: FlatListProps<ReactNode>['renderItem'] = ({ item }) => (
        <View style={horizontal ? { width: pageSize } : { height: pageSize }}>{item}</View>
    );

    return (
        <View
            className={cn(className)}
            style={horizontal ? styles.contentHorizontal : styles.contentVertical}
            onLayout={handleLayout}
        >
            <FlatList
                ref={flatListRef as React.RefObject<FlatList<ReactNode>>}
                data={items}
                renderItem={renderItem}
                keyExtractor={(_, i) => String(i)}
                horizontal={horizontal}
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                testID={testID}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                getItemLayout={(_, i) => ({ length: pageSize, offset: pageSize * i, index: i })}
            />
        </View>
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

const CarouselItem = ({ children, className, testID }: CarouselItemProps) => (
    <View testID={testID} className={cn(className)} style={styles.item}>
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

const NavGlyph = ({ glyph }: { glyph: string }) => {
    const colors = useThemeColors();
    return (
        <RNText
            accessibilityElementsHidden
            importantForAccessibility="no"
            style={[styles.navGlyph, { color: colors.semantic.text.default }]}
        >
            {glyph}
        </RNText>
    );
};

const CarouselPrevious = ({ className, testID, children }: CarouselButtonProps) => {
    const ctx = useCarouselContext('Carousel.Previous');
    const colors = useThemeColors();
    const { t } = useTranslation();
    const disabled = !ctx.loop && ctx.index === 0;
    return (
        <Pressable
            accessibilityLabel={t('carousel.previous')}
            accessibilityRole="button"
            accessibilityState={{ disabled }}
            disabled={disabled}
            className={cn(className)}
            testID={testID}
            onPress={ctx.prev}
            style={[
                styles.navBtn,
                styles.navBtnLeft,
                { opacity: disabled ? 0.4 : 1, backgroundColor: colors.semantic.background.elevated },
            ]}
        >
            {children ?? <NavGlyph glyph="‹" />}
        </Pressable>
    );
};

const CarouselNext = ({ className, testID, children }: CarouselButtonProps) => {
    const ctx = useCarouselContext('Carousel.Next');
    const colors = useThemeColors();
    const { t } = useTranslation();
    const disabled = !ctx.loop && ctx.index >= ctx.count - 1;
    return (
        <Pressable
            accessibilityLabel={t('carousel.next')}
            accessibilityRole="button"
            accessibilityState={{ disabled }}
            disabled={disabled}
            className={cn(className)}
            testID={testID}
            onPress={ctx.next}
            style={[
                styles.navBtn,
                styles.navBtnRight,
                { opacity: disabled ? 0.4 : 1, backgroundColor: colors.semantic.background.elevated },
            ]}
        >
            {children ?? <NavGlyph glyph="›" />}
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

const CarouselDots = ({ className, testID }: CarouselDotsProps) => {
    const ctx = useCarouselContext('Carousel.Dots');
    const colors = useThemeColors();
    const { t } = useTranslation();
    if (ctx.count === 0) {
        return null;
    }
    return (
        <View testID={testID} className={cn(className)} style={styles.dotsRow} accessibilityRole="tablist">
            {Array.from({ length: ctx.count }, (_, i) => (
                <Pressable
                    // biome-ignore lint/suspicious/noArrayIndexKey: dot index IS its stable identity
                    key={i}
                    onPress={() => ctx.scrollToIndex(i)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: i === ctx.index }}
                    accessibilityLabel={t('carousel.goToSlide', { index: i + 1 })}
                    // The dot stays small; the pressable around it is the 24pt target WCAG 2.2 asks for.
                    style={styles.dotTarget}
                >
                    <View
                        style={[
                            styles.dot,
                            i === ctx.index ? styles.dotActive : styles.dotInactive,
                            { backgroundColor: colors.semantic.text.default },
                        ]}
                    />
                </Pressable>
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
    contentHorizontal: {
        width: '100%',
    },
    contentVertical: {
        flex: 1,
    },
    item: {
        flex: 1,
    },
    navBtn: {
        position: 'absolute',
        top: '50%',
        // Half the button height: `top: 50%` alone places the top edge at the center.
        marginTop: -16,
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
    navGlyph: {
        fontSize: 22,
        lineHeight: 24,
    },
    dotsRow: {
        position: 'absolute',
        bottom: 4,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dotTarget: {
        minWidth: 24,
        height: 24,
        paddingHorizontal: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dot: {
        height: 6,
        borderRadius: 3,
    },
    dotActive: {
        width: 12,
    },
    dotInactive: {
        width: 6,
        opacity: 0.5,
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
