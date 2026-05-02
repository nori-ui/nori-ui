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
import { Platform, Pressable, Text as RNText, useWindowDimensions, View } from 'react-native';
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

export type PaginationOnPageChange = (info: { page: number; pageSize?: number }) => void;

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

function ItemButton({ type, selected, disabled, ariaLabel, ariaCurrent, label, onPress, testID }: ItemButtonProps) {
    const colors = useThemeColors();

    const isInteractive = !disabled && type !== 'ellipsis';
    const fg = selected ? colors.semantic.text.default : colors.semantic.text.muted;
    const bg = selected ? colors.semantic.background.subtle : 'transparent';

    if (type === 'ellipsis') {
        return (
            <View
                aria-hidden
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={{
                    minWidth: px(colors.spacing['8']),
                    minHeight: px(colors.spacing['8']),
                    paddingHorizontal: px(colors.spacing['2']),
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <RNText
                    style={{
                        fontFamily: colors.fontFamily.body,
                        fontSize: px(colors.fontSize.sm),
                        color: colors.semantic.text.muted,
                        fontVariant: ['tabular-nums'],
                    }}
                >
                    {label}
                </RNText>
            </View>
        );
    }

    return (
        <Pressable
            {...(testID !== undefined ? { testID } : {})}
            role="button"
            accessibilityRole="button"
            accessibilityLabel={ariaLabel}
            aria-label={ariaLabel}
            {...(ariaCurrent ? { 'aria-current': ariaCurrent, accessibilityState: { selected: true } } : {})}
            disabled={disabled}
            aria-disabled={disabled || undefined}
            onPress={isInteractive ? onPress : undefined}
            style={({ pressed }) => ({
                minWidth: px(colors.spacing['8']),
                minHeight: px(colors.spacing['8']),
                paddingHorizontal: px(colors.spacing['3']),
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: px(colors.radius.sm),
                backgroundColor: bg,
                opacity: disabled ? 0.4 : pressed ? 0.6 : 1,
            })}
        >
            <RNText
                style={{
                    fontFamily: colors.fontFamily.body,
                    fontSize: px(colors.fontSize.sm),
                    color: fg,
                    fontWeight: selected ? (colors.fontWeight.semibold as '600') : (colors.fontWeight.regular as '400'),
                    fontVariant: ['tabular-nums'],
                }}
            >
                {label}
            </RNText>
        </Pressable>
    );
}

// =============================================================================
// Live region for screen readers (web only — RN announces via accessibilityLiveRegion)
// =============================================================================

function LiveRegion({ message }: { message: string }) {
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
}

// =============================================================================
// Items renderer (the shorthand UI)
// =============================================================================

type ItemsRendererProps = {
    items: ReadonlyArray<PaginationItemDescriptor>;
    onItemPress: (item: PaginationItemDescriptor) => void;
};

function ItemsRenderer({ items, onItemPress }: ItemsRendererProps) {
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
}

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

function CompactView({
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
}) {
    const colors = useThemeColors();
    const { labels, dir } = usePaginationContext('Pagination(compact)');
    const flip = dir === 'rtl';

    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: px(colors.spacing['2']),
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
            <RNText
                style={{
                    fontFamily: colors.fontFamily.body,
                    fontSize: px(colors.fontSize.sm),
                    color: colors.semantic.text.default,
                    fontVariant: ['tabular-nums'],
                }}
            >
                {pageLabel}
            </RNText>
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
}

// =============================================================================
// Root (the `<Pagination>` symbol — also serves as the shorthand)
// =============================================================================

const ANNOUNCE_DEBOUNCE_MS = 150;

function PaginationRoot(props: PaginationProps) {
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
            onPageChange?.(
                effectivePageSize !== undefined ? { page: next, pageSize: effectivePageSize } : { page: next }
            );
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
            onPageChange?.({ page: 1, pageSize: next });
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

    // Compound mode — caller supplies the layout.
    if (children !== undefined) {
        return (
            <PaginationContext.Provider value={ctxValue}>
                <View
                    {...(testID !== undefined ? { testID } : {})}
                    role="navigation"
                    aria-label={ariaLabel ?? t('pagination.ariaLabel', { defaultValue: 'Pagination' })}
                    accessibilityLabel={ariaLabel ?? t('pagination.ariaLabel', { defaultValue: 'Pagination' })}
                    accessible
                    className={cn('flex-row items-center', className)}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: px(colors.spacing['2']),
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

    return (
        <PaginationContext.Provider value={ctxValue}>
            <View
                {...(testID !== undefined ? { testID } : {})}
                role="navigation"
                aria-label={ariaLabel ?? t('pagination.ariaLabel', { defaultValue: 'Pagination' })}
                accessibilityLabel={ariaLabel ?? t('pagination.ariaLabel', { defaultValue: 'Pagination' })}
                accessible
                className={cn('flex-row items-center', className)}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: px(colors.spacing['2']),
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
                {showRange && itemCount !== undefined && effectivePageSize !== undefined ? <PaginationRange /> : null}
            </View>
            <LiveRegion message={announcement} />
        </PaginationContext.Provider>
    );
}

// =============================================================================
// Compound parts
// =============================================================================

type CompoundButtonProps = {
    asChild?: boolean;
    children?: ReactNode;
    testID?: string;
};

function CompoundActionButton({
    actionType,
    asChild,
    children,
    testID,
}: CompoundButtonProps & { actionType: 'prev' | 'next' | 'first' | 'last' }) {
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
}

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
            }}
        >
            {message}
        </RNText>
    );
};

const PaginationPageSize: FC<{ options: ReadonlyArray<number>; testID?: string }> = ({ options, testID }) => {
    const ctx = usePaginationContext('Pagination.PageSize');
    const value = ctx.pageSize !== undefined ? String(ctx.pageSize) : '';
    const selectOptions = useMemo<SelectOption[]>(
        () => options.map((n) => ({ value: String(n), label: String(n) })),
        [options]
    );
    return (
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
    );
};

// =============================================================================
// Public symbol — Pagination + compound parts
// =============================================================================

type PaginationCompound = FC<PaginationProps> & {
    Root: FC<PaginationProps>;
    Items: FC<{ children?: ReactNode }>;
    Item: FC<{ page: number; asChild?: boolean; children?: ReactNode; testID?: string }>;
    Prev: FC<CompoundButtonProps>;
    Next: FC<CompoundButtonProps>;
    First: FC<CompoundButtonProps>;
    Last: FC<CompoundButtonProps>;
    Ellipsis: FC<{ children?: ReactNode }>;
    Range: FC;
    PageSize: FC<{ options: ReadonlyArray<number>; testID?: string }>;
};

export const Pagination = PaginationRoot as PaginationCompound;
Pagination.Root = PaginationRoot;
Pagination.Items = PaginationItems;
Pagination.Item = PaginationItem;
Pagination.Prev = PaginationPrev;
Pagination.Next = PaginationNext;
Pagination.First = PaginationFirst;
Pagination.Last = PaginationLast;
Pagination.Ellipsis = PaginationEllipsis;
Pagination.Range = PaginationRange;
Pagination.PageSize = PaginationPageSize;

// Re-exports under nominal compound names for tree-shake-friendly imports.
export {
    PaginationEllipsis,
    PaginationFirst,
    PaginationItem,
    PaginationItems,
    PaginationLast,
    PaginationNext,
    PaginationPageSize,
    PaginationPrev,
    PaginationRange,
    PaginationRoot,
};

// Suppress unused — ReactElement / KeyboardEvent are reserved for future kbd-nav extension.
type _Unused = ReactElement | KeyboardEvent;
