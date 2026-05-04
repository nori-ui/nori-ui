'use client';

import {
    type ComponentProps,
    createContext,
    type FC,
    type KeyboardEvent,
    type ReactElement,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import type { ViewStyle } from 'react-native';
import { Platform, Pressable, Text as RNText, TextInput as RNTextInput, useWindowDimensions, View } from 'react-native';
import { useTranslation } from '../../i18n/use-translation';
import { Slot } from '../../slot';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';
import { Select, type SelectOption } from '../Select';
import { type PaginationItemDescriptor, type PaginationItemType, usePagination } from './use-pagination';

// =============================================================================
// Public types
// =============================================================================

export { type UsePaginationArgs, type UsePaginationReturn, usePagination } from './use-pagination';
export type { PaginationItemDescriptor, PaginationItemType };

export type PaginationVariant = 'auto' | 'numbered' | 'compact';

export type PaginationRenderItemArgs = {
    type: PaginationItemType;
    page?: number;
    selected: boolean;
    disabled: boolean;
    ariaLabel: string;
    ariaCurrent?: 'page';
    children: ReactNode;
    onPress: () => void;
};

export type PaginationOnPageChange = (page: number, meta?: { pageSize?: number }) => void;

export type PaginationProps = {
    /** Controlled current page (1-indexed). */
    page?: number;
    /** Initial page when uncontrolled (1-indexed). @defaultValue 1 */
    defaultPage?: number;
    /** Total number of pages. Required. */
    pageCount: number;
    /** Pages on each side of the current page. @defaultValue 1 */
    siblingCount?: number;
    /** Pages always visible at start/end. @defaultValue 1 */
    boundaryCount?: number;
    /** Show first/last buttons. @defaultValue false */
    showFirstLast?: boolean;
    /** Hide the entire component when `pageCount <= 1`. @defaultValue true */
    hideOnSinglePage?: boolean;
    /**
     * Force a UI variant. `auto` swaps to `compact` on viewports under
     * `PAGINATION_COMPACT_BREAKPOINT` px wide.
     * @defaultValue 'auto'
     */
    variant?: PaginationVariant;
    /** Render the "Showing X–Y of Z" range automatically. @defaultValue false */
    showRange?: boolean;
    /** Total item count — needed by `Pagination.Range` and `Pagination.PageSize`. */
    itemCount?: number;
    /** Items per page — needed by `Pagination.Range` and `Pagination.PageSize`. */
    pageSize?: number;
    /** Fired on every page (or page-size) change. */
    onPageChange?: PaginationOnPageChange;
    /** Render-prop slot for each item. Same signature on web + native. */
    renderItem?: (args: PaginationRenderItemArgs) => ReactNode;
    /** RTL override. @defaultValue 'ltr' */
    dir?: 'ltr' | 'rtl';
    /** Override individual labels (otherwise sourced from `useTranslation`). */
    previousLabel?: string;
    nextLabel?: string;
    firstLabel?: string;
    lastLabel?: string;
    /** Override the nav landmark label. */
    ariaLabel?: string;
    className?: string;
    testID?: string;
    /** Provide compound children to opt out of the items-array shorthand. */
    children?: ReactNode;
};

/** Viewport width below which `variant="auto"` switches to `compact`. */
export const PAGINATION_COMPACT_BREAKPOINT = 480;

// =============================================================================
// Context (used by both compound parts and the shorthand's internal layout)
// =============================================================================

type PaginationContextValue = {
    page: number;
    pageCount: number;
    pageSize: number | undefined;
    itemCount: number | undefined;
    siblingCount: number;
    boundaryCount: number;
    showFirstLast: boolean;
    dir: 'ltr' | 'rtl';
    labels: {
        prev: string;
        next: string;
        first: string;
        last: string;
        gotoPage: (page: number) => string;
        ellipsis: string;
        currentPage: string;
        rangeFmt: (from: number, to: number, total: number) => string;
        pageOfFmt: (page: number, total: number) => string;
        pageSize: string;
        jumperLabel: string;
        jumperPlaceholder: string;
    };
    renderItem?: (args: PaginationRenderItemArgs) => ReactNode;
    goToPage: (page: number) => void;
    setPageSize: (next: number) => void;
};

const PaginationContext = createContext<PaginationContextValue | null>(null);

const usePaginationContext = (label: string): PaginationContextValue => {
    const ctx = useContext(PaginationContext);
    if (!ctx) {
        throw new Error(`<${label}> must be rendered inside a <Pagination> or <Pagination.Root>.`);
    }
    return ctx;
};

// =============================================================================
// Default item button (used when `renderItem` is not provided)
// =============================================================================

type ItemButtonProps = {
    type: PaginationItemType;
    page?: number;
    selected: boolean;
    disabled: boolean;
    ariaLabel: string;
    ariaCurrent?: 'page';
    label: ReactNode;
    onPress: () => void;
    testID?: string;
};

const ItemButton = ({ type, selected, disabled, ariaLabel, ariaCurrent, label, onPress, testID }: ItemButtonProps) => {
    const colors = useThemeColors();
    const isChevron = type === 'prev' || type === 'next' || type === 'first' || type === 'last';
    const isInteractive = !disabled && type !== 'ellipsis';
    const size = px(colors.spacing['8']); // 32px — minimum touch target

    if (type === 'ellipsis') {
        // Ellipsis is presentational; no button chrome, no padding — just a
        // balanced spacer that keeps the row's rhythm intact.
        return (
            <View
                aria-hidden
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={{
                    minWidth: size,
                    minHeight: size,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <RNText
                    style={{
                        fontFamily: colors.fontFamily.body,
                        fontSize: px(colors.fontSize.sm),
                        color: colors.semantic.text.muted,
                        // Optical adjust so the dots sit on the row baseline.
                        marginTop: -2,
                        letterSpacing: 1,
                    }}
                >
                    {label}
                </RNText>
            </View>
        );
    }

    // Pre-compute the static style so the Pressable's function form only has
    // to overlay press/hover deltas. This is more robust on native, where
    // some renderers were observed to drop properties from the function-form
    // result intermittently — especially the selected pill's `backgroundColor`,
    // producing white text on a white background.
    const baseStyle: ViewStyle = {
        minWidth: size,
        height: size,
        paddingHorizontal: px(colors.spacing['2']),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: px(colors.radius.md),
        // Selected: filled pill in primary. Default: transparent. Press/hover
        // deltas overlay this in the style fn below.
        backgroundColor: selected ? colors.semantic.interactive.primary : 'transparent',
        // A 1px transparent border is reserved on every item so the layout
        // stays stable when the selected one shows its accent border.
        borderWidth: 1,
        borderColor: selected ? colors.semantic.interactive.primary : 'transparent',
        opacity: disabled ? 0.35 : 1,
    };

    // Web-only CSS transitions; merged into the static base on web.
    const webExtras =
        Platform.OS === 'web'
            ? ({
                  transitionProperty: 'background-color, color, border-color',
                  transitionDuration: '120ms',
                  transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
              } as unknown as ViewStyle)
            : null;
    const staticStyle: ViewStyle = { ...baseStyle, ...(webExtras ?? {}) };

    return (
        <Pressable
            {...(testID !== undefined ? { testID } : {})}
            role="button"
            accessibilityRole="button"
            accessibilityLabel={ariaLabel}
            aria-label={ariaLabel}
            {...(ariaCurrent ? { 'aria-current': ariaCurrent } : {})}
            disabled={disabled}
            aria-disabled={disabled || undefined}
            onPress={isInteractive ? onPress : undefined}
            // Use a function form ONLY on web so Pressable can read `hovered`.
            // On native the function form was observed to occasionally drop
            // its returned style block on iOS — so we pass a plain object,
            // which renders reliably.
            style={
                Platform.OS === 'web'
                    ? (state) => {
                          const { pressed, hovered } = state as { pressed: boolean; hovered?: boolean };
                          const interactive =
                              !selected && (pressed || hovered)
                                  ? colors.semantic.background.subtle
                                  : staticStyle.backgroundColor;
                          return { ...staticStyle, backgroundColor: interactive };
                      }
                    : staticStyle
            }
        >
            <RNText
                style={{
                    fontFamily: colors.fontFamily.body,
                    fontSize: isChevron ? px(colors.fontSize.md) : px(colors.fontSize.sm),
                    lineHeight: px(colors.fontSize.md),
                    color: selected
                        ? colors.semantic.text.inverted
                        : disabled
                          ? colors.semantic.text.muted
                          : colors.semantic.text.default,
                    fontWeight: selected ? (colors.fontWeight.semibold as '600') : (colors.fontWeight.medium as '500'),
                    fontVariant: ['tabular-nums'],
                    // Chevron glyphs sit a hair high in most fonts.
                    marginTop: isChevron ? -1 : 0,
                }}
            >
                {label}
            </RNText>
        </Pressable>
    );
};

// =============================================================================
// Live region for screen readers (web only — RN announces via accessibilityLiveRegion)
// =============================================================================

const LiveRegion = ({ message }: { message: string }) => {
    if (Platform.OS === 'web') {
        return (
            <View
                style={{
                    position: 'absolute',
                    width: 1,
                    height: 1,
                    overflow: 'hidden',
                    opacity: 0,
                }}
                role="status"
                aria-live="polite"
                aria-atomic
            >
                <RNText accessibilityLiveRegion="polite">{message}</RNText>
            </View>
        );
    }
    return (
        <View accessibilityLiveRegion="polite" style={{ width: 0, height: 0 }}>
            <RNText>{message}</RNText>
        </View>
    );
};

// =============================================================================
// Items renderer (the shorthand UI)
// =============================================================================

type ItemsRendererProps = {
    items: ReadonlyArray<PaginationItemDescriptor>;
    onItemPress: (item: PaginationItemDescriptor) => void;
};

const ItemsRenderer = ({ items, onItemPress }: ItemsRendererProps) => {
    const { labels, renderItem, dir } = usePaginationContext('Pagination.Items');

    const elements = items.map((item, idx) => {
        const key = `${item.type}-${item.page ?? idx}-${idx}`;
        const ariaLabel = ariaLabelFor(item, labels);
        const ariaCurrent = item.selected ? ('page' as const) : undefined;
        const display = displayLabelFor(item, labels, dir);
        const onPress = () => onItemPress(item);

        if (renderItem && item.type !== 'ellipsis') {
            return (
                <View key={key}>
                    {renderItem({
                        type: item.type,
                        ...(item.page !== undefined ? { page: item.page } : {}),
                        selected: item.selected ?? false,
                        disabled: item.disabled ?? false,
                        ariaLabel,
                        ...(ariaCurrent ? { ariaCurrent } : {}),
                        children: display,
                        onPress,
                    })}
                </View>
            );
        }

        return (
            <ItemButton
                key={key}
                type={item.type}
                {...(item.page !== undefined ? { page: item.page } : {})}
                selected={item.selected ?? false}
                disabled={item.disabled ?? false}
                ariaLabel={ariaLabel}
                {...(ariaCurrent ? { ariaCurrent } : {})}
                label={display}
                onPress={onPress}
            />
        );
    });

    return <>{elements}</>;
};

function ariaLabelFor(item: PaginationItemDescriptor, labels: PaginationContextValue['labels']): string {
    switch (item.type) {
        case 'first':
            return labels.first;
        case 'prev':
            return labels.prev;
        case 'next':
            return labels.next;
        case 'last':
            return labels.last;
        case 'ellipsis':
            return labels.ellipsis;
        case 'page':
            return item.selected ? labels.currentPage : labels.gotoPage(item.page ?? 0);
    }
}

function displayLabelFor(
    item: PaginationItemDescriptor,
    labels: PaginationContextValue['labels'],
    dir: 'ltr' | 'rtl'
): ReactNode {
    const flip = dir === 'rtl';
    switch (item.type) {
        case 'first':
            return flip ? '»' : '«';
        case 'last':
            return flip ? '«' : '»';
        case 'prev':
            return flip ? '›' : '‹';
        case 'next':
            return flip ? '‹' : '›';
        case 'ellipsis':
            return '…';
        case 'page':
            return String(item.page ?? '');
    }
}

// =============================================================================
// Compact variant
// =============================================================================

const CompactView = ({
    onPrev,
    onNext,
    canPrev,
    canNext,
    pageLabel,
}: {
    onPrev: () => void;
    onNext: () => void;
    canPrev: boolean;
    canNext: boolean;
    pageLabel: string;
}) => {
    const colors = useThemeColors();
    const { labels, dir } = usePaginationContext('Pagination(compact)');
    const flip = dir === 'rtl';

    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: px(colors.spacing['1']),
                flexGrow: 1,
            }}
        >
            <ItemButton
                type="prev"
                selected={false}
                disabled={!canPrev}
                ariaLabel={labels.prev}
                label={flip ? '›' : '‹'}
                onPress={onPrev}
            />
            <View
                style={{
                    flexGrow: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: px(colors.spacing['3']),
                }}
            >
                <RNText
                    style={{
                        fontFamily: colors.fontFamily.body,
                        fontSize: px(colors.fontSize.sm),
                        color: colors.semantic.text.default,
                        fontWeight: colors.fontWeight.medium as '500',
                        fontVariant: ['tabular-nums'],
                    }}
                >
                    {pageLabel}
                </RNText>
            </View>
            <ItemButton
                type="next"
                selected={false}
                disabled={!canNext}
                ariaLabel={labels.next}
                label={flip ? '‹' : '›'}
                onPress={onNext}
            />
        </View>
    );
};

// =============================================================================
// Root (the `<Pagination>` symbol — also serves as the shorthand)
// =============================================================================

const ANNOUNCE_DEBOUNCE_MS = 150;

const PaginationRoot = (props: PaginationProps) => {
    const {
        page: controlledPage,
        defaultPage = 1,
        pageCount,
        siblingCount = 1,
        boundaryCount = 1,
        showFirstLast = false,
        hideOnSinglePage = true,
        variant = 'auto',
        showRange = false,
        itemCount,
        pageSize: pageSizeProp,
        onPageChange,
        renderItem,
        dir = 'ltr',
        previousLabel,
        nextLabel,
        firstLabel,
        lastLabel,
        ariaLabel,
        className,
        testID,
        children,
    } = props;

    const { t } = useTranslation();
    const colors = useThemeColors();
    const { width } = useWindowDimensions();

    const [internalPageSize, setInternalPageSize] = useState<number | undefined>(pageSizeProp);
    useEffect(() => {
        setInternalPageSize(pageSizeProp);
    }, [pageSizeProp]);
    const effectivePageSize = pageSizeProp ?? internalPageSize;

    const labels = useMemo<PaginationContextValue['labels']>(
        () => ({
            prev: previousLabel ?? t('pagination.previous', { defaultValue: 'Previous page' }),
            next: nextLabel ?? t('pagination.next', { defaultValue: 'Next page' }),
            first: firstLabel ?? t('pagination.first', { defaultValue: 'First page' }),
            last: lastLabel ?? t('pagination.last', { defaultValue: 'Last page' }),
            ellipsis: t('pagination.ellipsis', { defaultValue: 'More pages' }),
            currentPage: t('pagination.currentPage', { defaultValue: 'Current page' }),
            gotoPage: (n) => t('pagination.gotoPage', { page: n, defaultValue: `Go to page ${n}` }),
            rangeFmt: (from, to, total) =>
                t('pagination.range', {
                    from,
                    to,
                    total,
                    defaultValue: `Showing ${from}–${to} of ${total}`,
                }),
            pageOfFmt: (p, total) => t('pagination.pageOf', { page: p, total, defaultValue: `Page ${p} of ${total}` }),
            pageSize: t('pagination.pageSizeLabel', { defaultValue: 'Items per page' }),
            jumperLabel: t('pagination.jumperLabel', { defaultValue: 'Go to page' }),
            jumperPlaceholder: t('pagination.jumperPlaceholder', { defaultValue: '#' }),
        }),
        [t, previousLabel, nextLabel, firstLabel, lastLabel]
    );

    // Live-region message — debounced so rapid clicks don't spam SR.
    const [announcement, setAnnouncement] = useState('');
    const announceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        return () => {
            if (announceTimer.current) {
                clearTimeout(announceTimer.current);
            }
        };
    }, []);

    const handlePageChange = useCallback(
        (next: number) => {
            onPageChange?.(next, effectivePageSize !== undefined ? { pageSize: effectivePageSize } : undefined);
            if (announceTimer.current) {
                clearTimeout(announceTimer.current);
            }
            announceTimer.current = setTimeout(() => {
                setAnnouncement(labels.pageOfFmt(next, Math.max(1, pageCount)));
            }, ANNOUNCE_DEBOUNCE_MS);
        },
        [onPageChange, effectivePageSize, labels, pageCount]
    );

    const setPageSize = useCallback(
        (next: number) => {
            if (pageSizeProp === undefined) {
                setInternalPageSize(next);
            }
            onPageChange?.(1, { pageSize: next });
        },
        [onPageChange, pageSizeProp]
    );

    const pagination = usePagination({
        ...(controlledPage !== undefined ? { page: controlledPage } : {}),
        defaultPage,
        pageCount,
        siblingCount,
        boundaryCount,
        showFirstLast,
        onPageChange: handlePageChange,
    });

    if (hideOnSinglePage && Math.max(1, pageCount) <= 1) {
        return null;
    }

    const ctxValue: PaginationContextValue = {
        page: pagination.page,
        pageCount: Math.max(1, pageCount),
        pageSize: effectivePageSize,
        itemCount,
        siblingCount,
        boundaryCount,
        showFirstLast,
        dir,
        labels,
        ...(renderItem ? { renderItem } : {}),
        goToPage: pagination.goToPage,
        setPageSize,
    };

    // Compound mode — caller supplies the layout. We still wrap children in
    // a flex-row that wraps on overflow so a long compound chain
    // (Items + Range + PageSize + Jumper) doesn't blow off the right edge
    // of a phone-width container.
    if (children !== undefined) {
        return (
            <PaginationContext.Provider value={ctxValue}>
                <View
                    {...(testID !== undefined ? { testID } : {})}
                    role="navigation"
                    aria-label={ariaLabel ?? t('pagination.ariaLabel', { defaultValue: 'Pagination' })}
                    accessibilityLabel={ariaLabel ?? t('pagination.ariaLabel', { defaultValue: 'Pagination' })}
                    accessible
                    className={cn('flex-row items-center flex-wrap', className)}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        rowGap: px(colors.spacing['2']),
                        columnGap: px(colors.spacing['1']),
                        direction: dir as ViewStyle['direction'],
                    }}
                >
                    {children}
                </View>
                <LiveRegion message={announcement} />
            </PaginationContext.Provider>
        );
    }

    // Shorthand mode — pick variant + render the items row.
    const isCompact =
        variant === 'compact' || (variant === 'auto' && width > 0 && width < PAGINATION_COMPACT_BREAKPOINT);

    const onItemPress = (item: PaginationItemDescriptor) => {
        if (item.disabled) {
            return;
        }
        switch (item.type) {
            case 'first':
                pagination.first();
                return;
            case 'prev':
                pagination.prev();
                return;
            case 'next':
                pagination.next();
                return;
            case 'last':
                pagination.last();
                return;
            case 'page':
                if (item.page !== undefined) {
                    pagination.goToPage(item.page);
                }
                return;
            case 'ellipsis':
                return;
        }
    };

    const showRangeBlock = showRange && itemCount !== undefined && effectivePageSize !== undefined;

    return (
        <PaginationContext.Provider value={ctxValue}>
            <View
                {...(testID !== undefined ? { testID } : {})}
                role="navigation"
                aria-label={ariaLabel ?? t('pagination.ariaLabel', { defaultValue: 'Pagination' })}
                accessibilityLabel={ariaLabel ?? t('pagination.ariaLabel', { defaultValue: 'Pagination' })}
                accessible
                className={cn(isCompact ? 'flex-col items-stretch' : 'flex-row items-center flex-wrap', className)}
                style={{
                    // Compact mode lays out as a column so the Range/PageSize
                    // block falls below the controls instead of overflowing
                    // a phone-width row. Numbered mode wraps on overflow.
                    flexDirection: isCompact ? 'column' : 'row',
                    alignItems: isCompact ? 'stretch' : 'center',
                    flexWrap: isCompact ? 'nowrap' : 'wrap',
                    rowGap: px(colors.spacing['2']),
                    columnGap: px(colors.spacing['1']),
                    direction: dir as ViewStyle['direction'],
                }}
            >
                {isCompact ? (
                    <CompactView
                        onPrev={pagination.prev}
                        onNext={pagination.next}
                        canPrev={pagination.canPrev}
                        canNext={pagination.canNext}
                        pageLabel={labels.pageOfFmt(pagination.page, Math.max(1, pageCount))}
                    />
                ) : (
                    <ItemsRenderer items={pagination.pages} onItemPress={onItemPress} />
                )}
                {showRangeBlock ? <PaginationRange /> : null}
            </View>
            <LiveRegion message={announcement} />
        </PaginationContext.Provider>
    );
};

// =============================================================================
// Compound parts
// =============================================================================

type CompoundButtonProps = {
    asChild?: boolean;
    children?: ReactNode;
    testID?: string;
};

const CompoundActionButton = ({
    actionType,
    asChild,
    children,
    testID,
}: CompoundButtonProps & { actionType: 'prev' | 'next' | 'first' | 'last' }) => {
    const ctx = usePaginationContext(`Pagination.${actionType[0]!.toUpperCase() + actionType.slice(1)}`);
    const disabled = actionType === 'prev' || actionType === 'first' ? ctx.page <= 1 : ctx.page >= ctx.pageCount;
    const onPress = () => {
        if (disabled) {
            return;
        }
        switch (actionType) {
            case 'first':
                ctx.goToPage(1);
                return;
            case 'prev':
                ctx.goToPage(ctx.page - 1);
                return;
            case 'next':
                ctx.goToPage(ctx.page + 1);
                return;
            case 'last':
                ctx.goToPage(ctx.pageCount);
                return;
        }
    };
    const ariaLabel =
        actionType === 'prev'
            ? ctx.labels.prev
            : actionType === 'next'
              ? ctx.labels.next
              : actionType === 'first'
                ? ctx.labels.first
                : ctx.labels.last;

    if (asChild) {
        return (
            <Slot
                aria-label={ariaLabel}
                aria-disabled={disabled || undefined}
                onPress={onPress}
                onClick={onPress as unknown as ComponentProps<'button'>['onClick']}
            >
                {children}
            </Slot>
        );
    }
    const fallbackGlyph =
        actionType === 'prev' ? '‹' : actionType === 'next' ? '›' : actionType === 'first' ? '«' : '»';
    return (
        <ItemButton
            type={actionType}
            selected={false}
            disabled={disabled}
            ariaLabel={ariaLabel}
            label={children ?? fallbackGlyph}
            onPress={onPress}
            {...(testID !== undefined ? { testID } : {})}
        />
    );
};

const PaginationPrev: FC<CompoundButtonProps> = ({ asChild, children, testID }) =>
    CompoundActionButton({
        actionType: 'prev',
        ...(asChild !== undefined ? { asChild } : {}),
        ...(children !== undefined ? { children } : {}),
        ...(testID !== undefined ? { testID } : {}),
    });
const PaginationNext: FC<CompoundButtonProps> = ({ asChild, children, testID }) =>
    CompoundActionButton({
        actionType: 'next',
        ...(asChild !== undefined ? { asChild } : {}),
        ...(children !== undefined ? { children } : {}),
        ...(testID !== undefined ? { testID } : {}),
    });
const PaginationFirst: FC<CompoundButtonProps> = ({ asChild, children, testID }) =>
    CompoundActionButton({
        actionType: 'first',
        ...(asChild !== undefined ? { asChild } : {}),
        ...(children !== undefined ? { children } : {}),
        ...(testID !== undefined ? { testID } : {}),
    });
const PaginationLast: FC<CompoundButtonProps> = ({ asChild, children, testID }) =>
    CompoundActionButton({
        actionType: 'last',
        ...(asChild !== undefined ? { asChild } : {}),
        ...(children !== undefined ? { children } : {}),
        ...(testID !== undefined ? { testID } : {}),
    });

const PaginationItem: FC<{ page: number; asChild?: boolean; children?: ReactNode; testID?: string }> = ({
    page,
    asChild,
    children,
    testID,
}) => {
    const ctx = usePaginationContext('Pagination.Item');
    const selected = page === ctx.page;
    const onPress = () => ctx.goToPage(page);
    const ariaLabel = selected ? ctx.labels.currentPage : ctx.labels.gotoPage(page);

    if (asChild) {
        return (
            <Slot
                aria-label={ariaLabel}
                {...(selected ? { 'aria-current': 'page' as const } : {})}
                onPress={onPress}
                onClick={onPress as unknown as ComponentProps<'button'>['onClick']}
            >
                {children}
            </Slot>
        );
    }
    return (
        <ItemButton
            type="page"
            page={page}
            selected={selected}
            disabled={false}
            ariaLabel={ariaLabel}
            {...(selected ? { ariaCurrent: 'page' as const } : {})}
            label={children ?? String(page)}
            onPress={onPress}
            {...(testID !== undefined ? { testID } : {})}
        />
    );
};

const PaginationItems: FC<{ children?: ReactNode }> = ({ children }) => {
    const ctx = usePaginationContext('Pagination.Items');
    // Always run the hook so React's call order is stable across renders;
    // the result is discarded when explicit `children` were supplied.
    const result = usePagination({
        page: ctx.page,
        pageCount: ctx.pageCount,
        siblingCount: ctx.siblingCount,
        boundaryCount: ctx.boundaryCount,
        showFirstLast: false,
        showPrevNext: false,
    });
    if (children !== undefined) {
        return <>{children}</>;
    }
    return (
        <ItemsRenderer
            items={result.pages}
            onItemPress={(item) => {
                if (item.type === 'page' && item.page !== undefined) {
                    ctx.goToPage(item.page);
                }
            }}
        />
    );
};

const PaginationEllipsis: FC<{ children?: ReactNode }> = ({ children }) => {
    const ctx = usePaginationContext('Pagination.Ellipsis');
    return (
        <ItemButton
            type="ellipsis"
            selected={false}
            disabled
            label={children ?? '…'}
            ariaLabel={ctx.labels.ellipsis}
            onPress={() => {}}
        />
    );
};

const PaginationRange: FC = () => {
    const ctx = usePaginationContext('Pagination.Range');
    const colors = useThemeColors();
    if (ctx.itemCount === undefined || ctx.pageSize === undefined) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('<Pagination.Range> requires both `itemCount` and `pageSize` on <Pagination>.');
        }
        return null;
    }
    const from = (ctx.page - 1) * ctx.pageSize + 1;
    const to = Math.min(ctx.itemCount, ctx.page * ctx.pageSize);
    const message = ctx.labels.rangeFmt(from, to, ctx.itemCount);
    return (
        <RNText
            role="status"
            aria-live="polite"
            style={{
                fontFamily: colors.fontFamily.body,
                fontSize: px(colors.fontSize.sm),
                color: colors.semantic.text.muted,
                fontVariant: ['tabular-nums'],
                paddingHorizontal: px(colors.spacing['2']),
                // Sits on the same baseline as the 32px buttons.
                lineHeight: px(colors.spacing['8']),
            }}
        >
            {message}
        </RNText>
    );
};

const PaginationPageSize: FC<{ options: ReadonlyArray<number>; testID?: string }> = ({ options, testID }) => {
    const ctx = usePaginationContext('Pagination.PageSize');
    const colors = useThemeColors();
    const value = ctx.pageSize !== undefined ? String(ctx.pageSize) : '';
    const selectOptions = useMemo<SelectOption[]>(
        () => options.map((n) => ({ value: String(n), label: String(n) })),
        [options]
    );
    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: px(colors.spacing['2']),
            }}
        >
            <RNText
                style={{
                    fontFamily: colors.fontFamily.body,
                    fontSize: px(colors.fontSize.sm),
                    color: colors.semantic.text.muted,
                }}
            >
                {ctx.labels.pageSize}
            </RNText>
            <Select
                {...(testID !== undefined ? { testID } : {})}
                aria-label={ctx.labels.pageSize}
                options={selectOptions}
                value={value}
                onChange={(v) => {
                    const n = Number(v);
                    if (Number.isFinite(n) && n > 0) {
                        ctx.setPageSize(n);
                    }
                }}
            />
        </View>
    );
};

type PaginationJumperProps = {
    /** Show a separate visible "Go to page" label before the input. The aria-label is always set regardless. @defaultValue false */
    showLabel?: boolean;
    /** Override the visible label / accessible name. */
    label?: string;
    /** Override the input placeholder. @defaultValue the localized "Go to" hint */
    placeholder?: string;
    /** Width of the input in px. @defaultValue 56 */
    inputWidth?: number;
    testID?: string;
};

/**
 * Compact, purpose-built jumper. Built directly from RN's `TextInput`
 * primitive so we can render the exact 32px-tall borderless-then-focused
 * treatment that fits in a pagination row, instead of inheriting the full
 * form-field chrome (label, helper text, error slot) of `<TextInput>`.
 */
const PaginationJumper: FC<PaginationJumperProps> = ({
    showLabel = false,
    label,
    placeholder,
    inputWidth = 56,
    testID,
}) => {
    const ctx = usePaginationContext('Pagination.Jumper');
    const colors = useThemeColors();
    const [draft, setDraft] = useState('');
    const [focused, setFocused] = useState(false);
    const [hovered, setHovered] = useState(false);
    const visibleLabel = label ?? ctx.labels.jumperLabel;
    const placeholderText = placeholder ?? ctx.labels.jumperPlaceholder;

    const submit = () => {
        const trimmed = draft.trim();
        if (trimmed === '') {
            return;
        }
        const n = Number(trimmed);
        if (!Number.isFinite(n) || n < 1) {
            setDraft('');
            return;
        }
        const clamped = Math.min(Math.max(1, Math.floor(n)), ctx.pageCount);
        ctx.goToPage(clamped);
        setDraft('');
    };

    const borderColor = focused
        ? colors.semantic.interactive.primary
        : hovered
          ? colors.semantic.border.strong
          : colors.semantic.border.default;

    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: px(colors.spacing['2']),
            }}
        >
            {showLabel ? (
                <RNText
                    style={{
                        fontFamily: colors.fontFamily.body,
                        fontSize: px(colors.fontSize.sm),
                        color: colors.semantic.text.muted,
                    }}
                >
                    {visibleLabel}
                </RNText>
            ) : null}
            <View
                // The wrapper carries the visual chrome so the bare TextInput
                // can stay completely unstyled — it's just text + caret.
                onPointerEnter={Platform.OS === 'web' ? () => setHovered(true) : undefined}
                onPointerLeave={Platform.OS === 'web' ? () => setHovered(false) : undefined}
                style={
                    {
                        width: inputWidth,
                        height: px(colors.spacing['8']),
                        borderWidth: 1,
                        borderColor,
                        borderRadius: px(colors.radius.md),
                        backgroundColor: colors.semantic.background.elevated,
                        paddingHorizontal: px(colors.spacing['2']),
                        justifyContent: 'center',
                        // Web-only properties (silently dropped on native).
                        ...(focused
                            ? {
                                  boxShadow: `0 0 0 3px ${withAlpha(colors.semantic.interactive.primary, 0.15)}`,
                              }
                            : null),
                        transitionProperty: 'border-color, box-shadow',
                        transitionDuration: '120ms',
                        transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
                    } as unknown as ViewStyle
                }
            >
                <RNTextInput
                    {...(testID !== undefined ? { testID } : {})}
                    value={draft}
                    onChangeText={setDraft}
                    onSubmitEditing={submit}
                    onBlur={() => {
                        setFocused(false);
                        submit();
                    }}
                    onFocus={() => setFocused(true)}
                    keyboardType="number-pad"
                    inputMode="numeric"
                    placeholder={placeholderText}
                    placeholderTextColor={colors.semantic.text.muted}
                    aria-label={visibleLabel}
                    accessibilityLabel={visibleLabel}
                    returnKeyType="go"
                    selectTextOnFocus
                    style={{
                        fontFamily: colors.fontFamily.body,
                        fontSize: px(colors.fontSize.sm),
                        color: colors.semantic.text.default,
                        fontVariant: ['tabular-nums'],
                        textAlign: 'center',
                        // Strip the browser's default outline — we draw our own
                        // focus ring on the wrapper.
                        ...(Platform.OS === 'web' ? ({ outline: 'none' } as object) : null),
                    }}
                />
            </View>
        </View>
    );
};

/**
 * Apply an alpha channel to any of our token color strings (hex / rgb / hsl).
 * Cheap, zero-dep helper just for the focus glow.
 */
function withAlpha(color: string, alpha: number): string {
    if (color.startsWith('#') && (color.length === 7 || color.length === 4)) {
        const expanded =
            color.length === 4 ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}` : color;
        const r = Number.parseInt(expanded.slice(1, 3), 16);
        const g = Number.parseInt(expanded.slice(3, 5), 16);
        const b = Number.parseInt(expanded.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
}

export type { PaginationJumperProps };

// =============================================================================
// Public symbol — Pagination + compound parts
// =============================================================================

export const Pagination = Object.assign(PaginationRoot, {
    Items: PaginationItems,
    Item: PaginationItem,
    Prev: PaginationPrev,
    Next: PaginationNext,
    First: PaginationFirst,
    Last: PaginationLast,
    Ellipsis: PaginationEllipsis,
    Range: PaginationRange,
    PageSize: PaginationPageSize,
    Jumper: PaginationJumper,
});

// Suppress unused — ReactElement / KeyboardEvent are reserved for future kbd-nav extension.
type _Unused = ReactElement | KeyboardEvent;
