'use client';

// Breadcrumb — cross-platform, agent-friendly, width-aware.
//
// Two equivalent APIs:
//
//   1. Items-array (terse, agent-friendly, full-feature):
//
//        <Breadcrumb
//          items={[
//            { label: 'Home', href: '/' },
//            { label: 'Docs', href: '/docs' },
//            { label: 'Breadcrumb', current: true },
//          ]}
//          separator="/"
//          collapseOnOverflow
//        />
//
//   2. Compound (full JSX control):
//
//        <Breadcrumb separator="/">
//          <Breadcrumb.List>
//            <Breadcrumb.Item><Breadcrumb.Link href="/">Home</Breadcrumb.Link></Breadcrumb.Item>
//            <Breadcrumb.Item><Breadcrumb.Link href="/docs">Docs</Breadcrumb.Link></Breadcrumb.Item>
//            <Breadcrumb.Item><Breadcrumb.Page>Breadcrumb</Breadcrumb.Page></Breadcrumb.Item>
//          </Breadcrumb.List>
//        </Breadcrumb>
//
// Key design notes:
//   - Width-based collapse works on BOTH platforms via React Native's
//     `onLayout` (which react-native-web shims via ResizeObserver). A
//     hidden measurement copy of the full list reports per-item widths;
//     the visible list renders only the items that fit.
//   - Auto-`aria-current="page"` on the last item or any item flagged
//     `current`.
//   - JSON-LD BreadcrumbList schema emitted on web for SEO + LLM ingest
//     (opt-out via `schemaOrg={false}`). Injected client-side via
//     `document.head`; SSR consumers can use the exported
//     `getBreadcrumbJsonLd()` helper with their framework's metadata API.
//   - Per-item `siblings` opens a sibling menu (the VSCode/file-path
//     pattern). Uses our `Popover` primitive.

import {
    Children,
    type ComponentType,
    createContext,
    Fragment,
    isValidElement,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import type { LayoutChangeEvent, ViewStyle } from 'react-native';
import { Platform, Pressable, Text as RNText, ScrollView, View } from 'react-native';
import { useTranslation } from '../../i18n/use-translation';
import { Slot } from '../../slot';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';
import { Popover } from '../Popover';

// =============================================================================
// Types
// =============================================================================

/** Where the ellipsis sends the user when tapped/clicked. */
export type BreadcrumbExpandBehavior =
    /** Replace `…` with all hidden items inline (MUI). Web default. */
    | 'inline'
    /** Open a popover/sheet listing the hidden items (Primer / iOS). Native default. */
    | 'menu'
    /** Don't collapse — fall back to a horizontal scroll container. Useful for IDE-style file paths. */
    | 'scroll'
    /** Render `…` but don't react to interaction. Pure visual hint. */
    | 'none';

export type BreadcrumbSeparatorContext = {
    /** Index of the item PRECEDING this separator. */
    fromIndex: number;
    /** Total visible items. */
    visibleCount: number;
    /** Reading direction at render time. */
    dir: 'ltr' | 'rtl';
};

export type BreadcrumbSeparatorValue = string | ReactNode | ((ctx: BreadcrumbSeparatorContext) => ReactNode);

export type BreadcrumbIcon = ComponentType<{ size?: number; color?: string }>;

export type BreadcrumbSibling = {
    /** Visible label. */
    label: ReactNode;
    /** Link target. Omit for an `onSelect`-driven sibling. */
    href?: string;
    /** Optional leading icon. */
    icon?: BreadcrumbIcon;
    /** Click / tap handler. */
    onSelect?: () => void;
    /** Render as inactive in the sibling menu. */
    disabled?: boolean;
};

export type BreadcrumbItemData = {
    /** Visible label. Strings are wrapped in `<Text>`; ReactNode passes through. */
    label: ReactNode;
    /** Link target. When omitted and not `current`, the item renders as a button (use with `onSelect`). */
    href?: string;
    /** Leading icon component (lucide, custom, …). Sized to the line height. */
    icon?: BreadcrumbIcon;
    /** Marks this item as the current page. The last item is auto-flagged when no item is explicitly current. */
    current?: boolean;
    /** Sibling list — when provided, the item gets a chevron and opens a popover menu of siblings on tap. */
    siblings?: BreadcrumbSibling[];
    /** Render a skeleton instead of the label — useful while async paths resolve. */
    loading?: boolean;
    /** Click / tap handler when `href` is absent. */
    onSelect?: () => void;
    /** Stable key for React's reconciler. Defaults to the item index. */
    key?: string | number;
    /** Override per-item label truncation in characters. 0 disables truncation. */
    maxLabelLength?: number;
};

export type BreadcrumbProps = {
    /** Items-array mode. When provided, `children` is ignored. */
    items?: ReadonlyArray<BreadcrumbItemData>;
    /**
     * Visual separator between items. Strings render as plain text; nodes
     * render as-is; functions receive `(ctx)` and return a node.
     * @defaultValue a chevron glyph (auto-flips for RTL)
     */
    separator?: BreadcrumbSeparatorValue;
    /**
     * Maximum number of visible items. The middle is collapsed into a
     * single ellipsis; the first / last items are kept by default.
     * Pass `0` or `undefined` to disable count-based collapse.
     */
    maxItems?: number;
    /** How many items at the START of the list stay visible when the middle collapses. @defaultValue 1 */
    itemsBeforeCollapse?: number;
    /** How many items at the END of the list stay visible when the middle collapses. @defaultValue 1 */
    itemsAfterCollapse?: number;
    /**
     * Width-based collapse using `onLayout` (works on RN-Web via the
     * built-in ResizeObserver shim and on native via the layout system).
     * The library renders a hidden measurement copy of every item, then
     * shows only the items that fit the container — middle items are
     * folded into the ellipsis. Pass `false` to opt out and let the row
     * grow to its natural width (it will overflow its parent if the
     * parent does not provide its own scroll/clip handling).
     * @defaultValue true
     */
    collapseOnOverflow?: boolean;
    /**
     * What the ellipsis does when tapped/clicked.
     * @defaultValue 'inline' on web, 'menu' on native
     */
    expandBehavior?: BreadcrumbExpandBehavior;
    /** Override the default i18n string for the "show full path" SR label. */
    expandLabel?: string;
    /** Override the default i18n string for the ellipsis SR label. */
    ellipsisLabel?: string;
    /**
     * Visually-hidden prefix announced before the current page's label.
     * Helps screen readers convey "Current page: Settings" instead of "Settings".
     */
    currentPageLabel?: string;
    /** Override the SR label for sibling menus opened from a crumb. */
    siblingMenuLabel?: string;
    /** Visible aria-label on the wrapping `<nav>`. @defaultValue translated "Breadcrumb" */
    ariaLabel?: string;
    /**
     * Emit JSON-LD `BreadcrumbList` structured data for SEO + LLM
     * ingest. Web only; ignored on native.
     * @defaultValue true (only when `items` is provided AND on web)
     */
    schemaOrg?: boolean;
    /**
     * Reading direction. RTL flips the default chevron separator and the
     * collapse logic so the start/end stay anchored to the right edge.
     * @defaultValue 'ltr'
     */
    dir?: 'ltr' | 'rtl';
    /**
     * Truncate each item's label after this many characters. Per-item
     * `maxLabelLength` overrides this. @defaultValue 0 (no truncation)
     */
    maxLabelLength?: number;
    children?: ReactNode;
    className?: string;
    testID?: string;
};

// =============================================================================
// Context (compound mode only)
// =============================================================================

type BreadcrumbContextValue = {
    separator: BreadcrumbSeparatorValue;
    dir: 'ltr' | 'rtl';
    currentPageLabel: string;
    siblingMenuLabel: string;
    maxLabelLength: number;
};

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);

const useBreadcrumbContext = (label: string): BreadcrumbContextValue => {
    const ctx = useContext(BreadcrumbContext);
    if (!ctx) {
        throw new Error(`<${label}> must be rendered inside a <Breadcrumb>.`);
    }
    return ctx;
};

// =============================================================================
// Defaults / markers
// =============================================================================

const DEFAULT_ITEMS_BEFORE = 1;
const DEFAULT_ITEMS_AFTER = 1;

type CompoundChildKind = 'item' | 'separator';
const COMPOUND_KIND_KEY = '__nori_breadcrumb_kind__';

function tagComponent<T>(component: T, kind: CompoundChildKind): T {
    (component as unknown as Record<string, unknown>)[COMPOUND_KIND_KEY] = kind;
    return component;
}

function getCompoundKind(node: ReactNode): CompoundChildKind | undefined {
    if (!isValidElement(node)) {
        return undefined;
    }
    const type = node.type as unknown as { [k: string]: unknown };
    const tagged = type?.[COMPOUND_KIND_KEY];
    return tagged === 'item' || tagged === 'separator' ? tagged : undefined;
}

// =============================================================================
// Default chevron separator
// =============================================================================

const DefaultChevron = ({ dir }: { dir: 'ltr' | 'rtl' }) => {
    const colors = useThemeColors();
    const flipped = dir === 'rtl';
    if (Platform.OS === 'web') {
        return (
            <svg
                width={14}
                height={14}
                viewBox="0 0 24 24"
                fill="none"
                stroke={colors.semantic.text.muted}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                style={{ transform: flipped ? 'scaleX(-1)' : undefined, flexShrink: 0 }}
            >
                <path d="m9 18 6-6-6-6" />
            </svg>
        );
    }
    return (
        <RNText
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{
                fontSize: 14,
                lineHeight: 20,
                color: colors.semantic.text.muted,
                transform: flipped ? [{ scaleX: -1 }] : undefined,
            }}
        >
            ›
        </RNText>
    );
};

const SeparatorText = ({ children }: { children: ReactNode }) => {
    const colors = useThemeColors();
    return (
        <RNText
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{
                fontSize: px(colors.fontSize.sm),
                lineHeight: px(colors.fontSize.md) * 1.4,
                color: colors.semantic.text.muted,
                fontFamily: colors.fontFamily.body,
                paddingHorizontal: 2,
            }}
        >
            {children}
        </RNText>
    );
};

function renderSeparator(separator: BreadcrumbSeparatorValue | undefined, ctx: BreadcrumbSeparatorContext): ReactNode {
    if (separator === undefined) {
        return <DefaultChevron dir={ctx.dir} />;
    }
    if (typeof separator === 'function') {
        return separator(ctx);
    }
    if (typeof separator === 'string') {
        return <SeparatorText>{separator}</SeparatorText>;
    }
    return separator;
}

// =============================================================================
// Width-based overflow fit
// =============================================================================

type OverflowFitArgs = {
    enabled: boolean;
    /** Total candidate items (after count-collapse). */
    itemCount: number;
    itemsBeforeCollapse: number;
    itemsAfterCollapse: number;
};

type OverflowFitState = {
    visibleIndices: Set<number>;
    ready: boolean;
    onContainerLayout: (event: LayoutChangeEvent) => void;
    onItemLayout: (index: number) => (event: LayoutChangeEvent) => void;
    onEllipsisLayout: (event: LayoutChangeEvent) => void;
    onSeparatorLayout: (event: LayoutChangeEvent) => void;
};

function useOverflowFit({
    enabled,
    itemCount,
    itemsBeforeCollapse,
    itemsAfterCollapse,
}: OverflowFitArgs): OverflowFitState {
    const [containerWidth, setContainerWidth] = useState<number | null>(null);
    const itemWidthsRef = useRef<Map<number, number>>(new Map());
    const ellipsisWidthRef = useRef<number>(0);
    const separatorWidthRef = useRef<number>(0);
    // The widths above live in refs so we can write to them inside layout
    // callbacks without React's setState quotas. But the fit algorithm
    // depends on them — so any change has to invalidate the visibleIndices
    // memo. Bumping `widthsTick` does both: triggers a re-render AND adds
    // a memo dependency that actually changes between writes.
    const [widthsTick, setWidthsTick] = useState(0);

    const onContainerLayout = useCallback((event: LayoutChangeEvent) => {
        const w = event.nativeEvent.layout.width;
        setContainerWidth((prev) => (prev !== null && Math.abs(prev - w) < 0.5 ? prev : w));
    }, []);

    const onItemLayout = useCallback(
        (index: number) => (event: LayoutChangeEvent) => {
            const w = event.nativeEvent.layout.width;
            const prev = itemWidthsRef.current.get(index);
            if (prev === undefined || Math.abs(prev - w) >= 0.5) {
                itemWidthsRef.current.set(index, w);
                setWidthsTick((t) => t + 1);
            }
        },
        []
    );

    const onEllipsisLayout = useCallback((event: LayoutChangeEvent) => {
        const w = event.nativeEvent.layout.width;
        if (Math.abs(ellipsisWidthRef.current - w) >= 0.5) {
            ellipsisWidthRef.current = w;
            setWidthsTick((t) => t + 1);
        }
    }, []);

    const onSeparatorLayout = useCallback((event: LayoutChangeEvent) => {
        const w = event.nativeEvent.layout.width;
        if (Math.abs(separatorWidthRef.current - w) >= 0.5) {
            separatorWidthRef.current = w;
            setWidthsTick((t) => t + 1);
        }
    }, []);

    // biome-ignore lint/correctness/useExhaustiveDependencies: widthsTick is a manual invalidation signal for ref-stored measurements; the algorithm reads itemWidthsRef/ellipsisWidthRef/separatorWidthRef which biome can't see through
    const visibleIndices = useMemo<Set<number>>(() => {
        const all = new Set<number>();
        for (let i = 0; i < itemCount; i += 1) {
            all.add(i);
        }
        if (!enabled || containerWidth === null || itemCount === 0) {
            return all;
        }
        const widths = itemWidthsRef.current;
        // Wait for every item to report a width — incomplete measurements
        // can collapse a long item that actually fits.
        if (widths.size < itemCount) {
            return all;
        }
        const sep = separatorWidthRef.current;
        const ell = ellipsisWidthRef.current;

        // Total of the full list = sum(items) + sep * (count - 1).
        let total = 0;
        for (let i = 0; i < itemCount; i += 1) {
            total += widths.get(i) ?? 0;
        }
        total += sep * Math.max(0, itemCount - 1);
        if (total <= containerWidth) {
            return all;
        }

        const before = Math.max(0, Math.min(itemsBeforeCollapse, itemCount));
        const after = Math.max(0, Math.min(itemsAfterCollapse, itemCount - before));

        // Anchors are the items the user has guaranteed to keep visible.
        // Start with them, plus the ellipsis cell, then grow inward as
        // long as we have budget.
        const anchorIndices = new Set<number>();
        for (let i = 0; i < before; i += 1) {
            anchorIndices.add(i);
        }
        for (let i = itemCount - after; i < itemCount; i += 1) {
            anchorIndices.add(i);
        }
        let used = 0;
        for (const idx of anchorIndices) {
            used += widths.get(idx) ?? 0;
        }
        // ellipsis takes one cell + separators on each side that has anchors.
        used += ell;
        const sepCount = Math.max(0, anchorIndices.size + 1 - 1);
        used += sep * sepCount;

        if (used > containerWidth) {
            // Even the anchors don't fit — drop one anchor at a time
            // from the inner edge until the budget covers what's left
            // (always keeping at least one anchor on each side that had any).
            const beforeIdx: number[] = [];
            for (let i = 0; i < before; i += 1) {
                beforeIdx.push(i);
            }
            const afterIdx: number[] = [];
            for (let i = itemCount - after; i < itemCount; i += 1) {
                afterIdx.push(i);
            }
            const minBefore = before > 0 ? 1 : 0;
            const minAfter = after > 0 ? 1 : 0;
            while (used > containerWidth && (beforeIdx.length > minBefore || afterIdx.length > minAfter)) {
                if (beforeIdx.length > minBefore) {
                    const dropped = beforeIdx.pop();
                    if (dropped !== undefined) {
                        used -= (widths.get(dropped) ?? 0) + sep;
                        anchorIndices.delete(dropped);
                    }
                }
                if (used <= containerWidth) {
                    break;
                }
                if (afterIdx.length > minAfter) {
                    const dropped = afterIdx.shift();
                    if (dropped !== undefined) {
                        used -= (widths.get(dropped) ?? 0) + sep;
                        anchorIndices.delete(dropped);
                    }
                }
            }
            return anchorIndices;
        }

        // Try to grow back: include adjacent items as long as they fit.
        // Alternate left and right so context near both edges is balanced.
        let leftCursor = before;
        let rightCursor = itemCount - after - 1;
        while (leftCursor <= rightCursor) {
            const w = widths.get(leftCursor) ?? 0;
            if (used + w + sep <= containerWidth) {
                anchorIndices.add(leftCursor);
                used += w + sep;
                leftCursor += 1;
            } else {
                break;
            }
            if (leftCursor > rightCursor) {
                break;
            }
            const w2 = widths.get(rightCursor) ?? 0;
            if (used + w2 + sep <= containerWidth) {
                anchorIndices.add(rightCursor);
                used += w2 + sep;
                rightCursor -= 1;
            } else {
                break;
            }
        }
        return anchorIndices;
    }, [containerWidth, itemCount, itemsBeforeCollapse, itemsAfterCollapse, enabled, widthsTick]);

    const ready = !enabled || (containerWidth !== null && itemWidthsRef.current.size >= itemCount);

    return {
        visibleIndices,
        ready,
        onContainerLayout,
        onItemLayout,
        onEllipsisLayout,
        onSeparatorLayout,
    };
}

// =============================================================================
// Count-based collapse helper
// =============================================================================

function applyCountCollapse(
    items: ReadonlyArray<BreadcrumbItemData>,
    maxItems: number | undefined,
    before: number,
    after: number
): { visible: ReadonlyArray<BreadcrumbItemData>; hidden: ReadonlyArray<BreadcrumbItemData>; collapseAt: number } {
    if (!maxItems || items.length <= maxItems) {
        return { visible: items, hidden: [], collapseAt: -1 };
    }
    const beforeArr = items.slice(0, Math.max(0, Math.min(before, items.length)));
    const afterArr = after > 0 ? items.slice(Math.max(beforeArr.length, items.length - after)) : [];
    const hidden = items.slice(beforeArr.length, items.length - afterArr.length);
    const visible = [...beforeArr, ...afterArr];
    return { visible, hidden, collapseAt: beforeArr.length };
}

// =============================================================================
// JSON-LD
// =============================================================================

/**
 * Build a JSON-LD `BreadcrumbList` document from a list of items. Use it
 * with your framework's metadata API for SSR-time emission:
 *
 * ```tsx
 * // Next.js App Router metadata
 * export async function generateMetadata() {
 *   return { other: { 'application/ld+json': getBreadcrumbJsonLd(items) } };
 * }
 * ```
 *
 * The component renders this client-side via `document.head` injection
 * automatically — but framework-driven SSR is preferred for reliable
 * search-engine pickup, hence this exported helper.
 */
export function getBreadcrumbJsonLd(items: ReadonlyArray<BreadcrumbItemData>): string {
    const elements = items
        .map((it, idx) => {
            const name = typeof it.label === 'string' ? it.label : undefined;
            if (!name) {
                return null;
            }
            const entry: Record<string, unknown> = {
                '@type': 'ListItem',
                position: idx + 1,
                name,
            };
            if (it.href) {
                entry.item = it.href;
            }
            return entry;
        })
        .filter((x): x is Record<string, unknown> => x !== null);
    return JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: elements,
    });
}

function useBreadcrumbJsonLdInjection(items: ReadonlyArray<BreadcrumbItemData>, enabled: boolean) {
    useEffect(() => {
        if (!enabled || Platform.OS !== 'web' || typeof document === 'undefined') {
            return;
        }
        const json = getBreadcrumbJsonLd(items);
        // Skip emitting an empty BreadcrumbList — no items resolve to a
        // string label means nothing useful for crawlers.
        if (!json.includes('"itemListElement":[{')) {
            return;
        }
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        // Use textContent (not innerHTML) — the browser doesn't parse it as
        // HTML, so XSS via label content can't leak out of the script tag.
        script.textContent = json;
        script.setAttribute('data-nori-breadcrumb', 'true');
        document.head.appendChild(script);
        return () => {
            if (script.parentNode === document.head) {
                document.head.removeChild(script);
            }
        };
    }, [items, enabled]);
}

// =============================================================================
// Truncated label
// =============================================================================

function truncateString(input: string, max: number): string {
    if (max <= 0 || input.length <= max) {
        return input;
    }
    if (max <= 1) {
        return '…';
    }
    return `${input.slice(0, max - 1)}…`;
}

// =============================================================================
// Root
// =============================================================================

const BreadcrumbRoot = ({
    items,
    separator,
    maxItems,
    itemsBeforeCollapse = DEFAULT_ITEMS_BEFORE,
    itemsAfterCollapse = DEFAULT_ITEMS_AFTER,
    collapseOnOverflow,
    expandBehavior,
    expandLabel,
    ellipsisLabel,
    currentPageLabel,
    siblingMenuLabel,
    ariaLabel,
    schemaOrg,
    dir = 'ltr',
    maxLabelLength = 0,
    children,
    className,
    testID,
}: BreadcrumbProps) => {
    const { t } = useTranslation();
    const colors = useThemeColors();
    const resolvedAriaLabel = ariaLabel ?? t('breadcrumb.ariaLabel', { defaultValue: 'Breadcrumb' });
    const resolvedExpandLabel = expandLabel ?? t('breadcrumb.expandLabel', { defaultValue: 'Show full path' });
    const resolvedEllipsisLabel = ellipsisLabel ?? t('breadcrumb.ellipsisLabel', { defaultValue: 'More' });
    const resolvedCurrentPageLabel =
        currentPageLabel ?? t('breadcrumb.currentPageLabel', { defaultValue: 'Current page' });
    const resolvedSiblingMenuLabel =
        siblingMenuLabel ?? t('breadcrumb.siblingMenuLabel', { defaultValue: 'Open sibling pages' });

    const resolvedExpandBehavior: BreadcrumbExpandBehavior =
        expandBehavior ?? (Platform.OS === 'web' ? 'inline' : 'menu');

    if (items && items.length > 0) {
        return (
            <BreadcrumbItemsRenderer
                items={items}
                separator={separator}
                maxItems={maxItems}
                itemsBeforeCollapse={itemsBeforeCollapse}
                itemsAfterCollapse={itemsAfterCollapse}
                collapseOnOverflow={collapseOnOverflow ?? true}
                expandBehavior={resolvedExpandBehavior}
                expandLabel={resolvedExpandLabel}
                ellipsisLabel={resolvedEllipsisLabel}
                currentPageLabel={resolvedCurrentPageLabel}
                siblingMenuLabel={resolvedSiblingMenuLabel}
                ariaLabel={resolvedAriaLabel}
                schemaOrg={schemaOrg}
                dir={dir}
                maxLabelLength={maxLabelLength}
                {...(className !== undefined ? { className } : {})}
                {...(testID !== undefined ? { testID } : {})}
            />
        );
    }

    // Compound mode — context only; the list / items render themselves.
    const ctxValue: BreadcrumbContextValue = {
        separator: separator ?? '',
        dir,
        currentPageLabel: resolvedCurrentPageLabel,
        siblingMenuLabel: resolvedSiblingMenuLabel,
        maxLabelLength,
    };

    return (
        <BreadcrumbContext.Provider value={ctxValue}>
            <View
                {...(testID !== undefined ? { testID } : {})}
                role="navigation"
                aria-label={resolvedAriaLabel}
                accessible
                accessibilityLabel={resolvedAriaLabel}
                className={cn('flex-row items-center', className)}
                style={
                    {
                        flexDirection: 'row',
                        alignItems: 'center',
                        direction: dir as ViewStyle['direction'],
                        fontFamily: colors.fontFamily.body,
                    } as ViewStyle
                }
            >
                {children}
            </View>
        </BreadcrumbContext.Provider>
    );
};

// =============================================================================
// Items-mode renderer
// =============================================================================

type ItemsRendererProps = {
    items: ReadonlyArray<BreadcrumbItemData>;
    separator: BreadcrumbSeparatorValue | undefined;
    maxItems: number | undefined;
    itemsBeforeCollapse: number;
    itemsAfterCollapse: number;
    collapseOnOverflow: boolean;
    expandBehavior: BreadcrumbExpandBehavior;
    expandLabel: string;
    ellipsisLabel: string;
    currentPageLabel: string;
    siblingMenuLabel: string;
    ariaLabel: string;
    schemaOrg: boolean | undefined;
    dir: 'ltr' | 'rtl';
    maxLabelLength: number;
    className?: string;
    testID?: string;
};

const BreadcrumbItemsRenderer = ({
    items,
    separator,
    maxItems,
    itemsBeforeCollapse,
    itemsAfterCollapse,
    collapseOnOverflow,
    expandBehavior,
    expandLabel,
    ellipsisLabel,
    currentPageLabel,
    siblingMenuLabel,
    ariaLabel,
    schemaOrg,
    dir,
    maxLabelLength,
    className,
    testID,
}: ItemsRendererProps) => {
    const [inlineExpanded, setInlineExpanded] = useState(false);

    // Auto-flag the last item as current when nobody else claims it.
    const normalizedItems = useMemo<ReadonlyArray<BreadcrumbItemData>>(() => {
        if (items.length === 0) {
            return items;
        }
        const anyCurrent = items.some((it) => it.current);
        if (anyCurrent) {
            return items;
        }
        const last = items[items.length - 1];
        if (!last) {
            return items;
        }
        const out: BreadcrumbItemData[] = [...items];
        out[out.length - 1] = { ...last, current: true };
        return out;
    }, [items]);

    useBreadcrumbJsonLdInjection(normalizedItems, schemaOrg !== false);

    // -------- COUNT-BASED COLLAPSE --------
    const countCollapse = useMemo(
        () =>
            applyCountCollapse(
                normalizedItems,
                inlineExpanded ? undefined : maxItems,
                itemsBeforeCollapse,
                itemsAfterCollapse
            ),
        [normalizedItems, maxItems, itemsBeforeCollapse, itemsAfterCollapse, inlineExpanded]
    );

    // -------- WIDTH-BASED COLLAPSE --------
    // Width-based fit runs on the post-count-collapse list — count is
    // always the ceiling. Width may further shrink the visible set.
    const widthFit = useOverflowFit({
        enabled: collapseOnOverflow && expandBehavior !== 'scroll' && !inlineExpanded,
        itemCount: countCollapse.visible.length,
        itemsBeforeCollapse,
        itemsAfterCollapse,
    });

    const widthHiddenItems = useMemo(() => {
        if (!collapseOnOverflow || expandBehavior === 'scroll' || inlineExpanded) {
            return [] as ReadonlyArray<BreadcrumbItemData>;
        }
        return countCollapse.visible.filter((_, idx) => !widthFit.visibleIndices.has(idx));
    }, [collapseOnOverflow, expandBehavior, inlineExpanded, countCollapse.visible, widthFit.visibleIndices]);

    const allHiddenItems = useMemo<ReadonlyArray<BreadcrumbItemData>>(() => {
        if (inlineExpanded) {
            return [];
        }
        return [...countCollapse.hidden, ...widthHiddenItems];
    }, [countCollapse.hidden, widthHiddenItems, inlineExpanded]);

    const visibleItemsForRender = useMemo<ReadonlyArray<BreadcrumbItemData>>(() => {
        if (inlineExpanded) {
            return normalizedItems;
        }
        return countCollapse.visible.filter((_, idx) =>
            collapseOnOverflow && expandBehavior !== 'scroll' ? widthFit.visibleIndices.has(idx) : true
        );
    }, [
        countCollapse.visible,
        widthFit.visibleIndices,
        collapseOnOverflow,
        expandBehavior,
        inlineExpanded,
        normalizedItems,
    ]);

    // Where to insert the ellipsis. Heuristic: after `itemsBeforeCollapse`
    // visible items from the start (clamped to the visible length).
    const ellipsisInsertAt = useMemo(() => {
        if (inlineExpanded || allHiddenItems.length === 0) {
            return -1;
        }
        return Math.min(itemsBeforeCollapse, visibleItemsForRender.length);
    }, [allHiddenItems.length, inlineExpanded, visibleItemsForRender.length, itemsBeforeCollapse]);

    const renderedCells: ReactNode[] = [];
    const measurementCells: ReactNode[] = [];

    visibleItemsForRender.forEach((item, idx) => {
        if (idx === ellipsisInsertAt && allHiddenItems.length > 0) {
            renderedCells.push(
                <Fragment key="__ellipsis__">
                    <BreadcrumbEllipsisInternal
                        ellipsisLabel={ellipsisLabel}
                        expandLabel={expandLabel}
                        expandBehavior={expandBehavior}
                        hiddenItems={allHiddenItems}
                        onExpandInline={() => setInlineExpanded(true)}
                    />
                </Fragment>
            );
            renderedCells.push(
                <Fragment key="__sep_ellipsis__">
                    {renderSeparator(separator, {
                        fromIndex: idx - 1,
                        visibleCount: visibleItemsForRender.length + 1,
                        dir,
                    })}
                </Fragment>
            );
        }

        const itemKey = item.key ?? `item-${normalizedItems.indexOf(item)}`;
        renderedCells.push(
            <Fragment key={itemKey}>
                <BreadcrumbItemRenderer
                    item={item}
                    currentPageLabel={currentPageLabel}
                    siblingMenuLabel={siblingMenuLabel}
                    maxLabelLength={maxLabelLength}
                />
            </Fragment>
        );
        const isLast = idx === visibleItemsForRender.length - 1;
        if (!isLast) {
            renderedCells.push(
                <Fragment key={`sep-${itemKey}`}>
                    {renderSeparator(separator, {
                        fromIndex: idx,
                        visibleCount: visibleItemsForRender.length,
                        dir,
                    })}
                </Fragment>
            );
        }
    });

    if (collapseOnOverflow && expandBehavior !== 'scroll') {
        countCollapse.visible.forEach((item, idx) => {
            const itemKey = item.key ?? `m-${idx}`;
            measurementCells.push(
                <View key={itemKey} onLayout={widthFit.onItemLayout(idx)}>
                    <BreadcrumbItemRenderer
                        item={item}
                        currentPageLabel={currentPageLabel}
                        siblingMenuLabel={siblingMenuLabel}
                        maxLabelLength={maxLabelLength}
                    />
                </View>
            );
        });
        measurementCells.push(
            <View key="__m_sep__" onLayout={widthFit.onSeparatorLayout}>
                {renderSeparator(separator, {
                    fromIndex: 0,
                    visibleCount: countCollapse.visible.length,
                    dir,
                })}
            </View>
        );
        measurementCells.push(
            <View key="__m_ellipsis__" onLayout={widthFit.onEllipsisLayout}>
                <BreadcrumbEllipsisInternal
                    ellipsisLabel={ellipsisLabel}
                    expandLabel={expandLabel}
                    expandBehavior="none"
                    hiddenItems={[]}
                    onExpandInline={() => undefined}
                />
            </View>
        );
    }

    const list = (
        <View
            role="list"
            accessibilityRole="list"
            className={cn('flex-row items-center')}
            style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1, minWidth: 0 }}
        >
            {renderedCells}
        </View>
    );

    // When width-based collapse is on, the wrapper MUST measure the
    // available width — not its content's natural width. Without an
    // explicit `width: '100%'` (or `alignSelf: 'stretch'`) the wrapper
    // hugs its row of items on native, so `containerWidth` from
    // `onLayout` equals the items' total — and the algorithm
    // never sees an overflow. With `width: '100%'`, the wrapper fills
    // its parent's cross-axis (which is the row width in a typical
    // column-flex parent), giving us a real budget to compare against.
    const wrapperStyle: ViewStyle = {
        flexDirection: 'row',
        alignItems: 'center',
        direction: dir as ViewStyle['direction'],
        flexShrink: 1,
        minWidth: 0,
        ...(collapseOnOverflow && expandBehavior !== 'scroll' ? { width: '100%' } : null),
        // `overflow: 'hidden'` keeps the visible row from blowing past
        // its container before the first measurement settles. Without
        // it, native renders the natural-width row briefly on the first
        // paint, even though the JS layout reports the correct measured
        // width on the very next tick.
        ...(collapseOnOverflow ? { overflow: 'hidden' as ViewStyle['overflow'] } : null),
    };

    return (
        <View
            {...(testID !== undefined ? { testID } : {})}
            role="navigation"
            aria-label={ariaLabel}
            accessible
            accessibilityLabel={ariaLabel}
            className={cn('flex-row items-center', className)}
            style={wrapperStyle}
            onLayout={collapseOnOverflow && expandBehavior !== 'scroll' ? widthFit.onContainerLayout : undefined}
        >
            {expandBehavior === 'scroll' ? (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ flexDirection: 'row', alignItems: 'center' }}
                    style={{ flexGrow: 1 }}
                >
                    {list}
                </ScrollView>
            ) : (
                list
            )}

            {/* Hidden measurement copy. Offscreen on both platforms. */}
            {collapseOnOverflow && expandBehavior !== 'scroll' ? (
                <View
                    aria-hidden
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    style={{
                        position: 'absolute',
                        opacity: 0,
                        flexDirection: 'row',
                        alignItems: 'center',
                        left: -99999,
                        top: 0,
                        // `pointerEvents` lives on the style object now —
                        // the prop form is deprecated in RN 0.71+ / RN-Web
                        // 0.20+ and emits a runtime warning every render.
                        pointerEvents: 'none' as ViewStyle['pointerEvents'],
                    }}
                >
                    {measurementCells}
                </View>
            ) : null}
        </View>
    );
};

// =============================================================================
// Item renderer (items-mode)
// =============================================================================

type ItemRendererProps = {
    item: BreadcrumbItemData;
    currentPageLabel: string;
    siblingMenuLabel: string;
    maxLabelLength: number;
};

const BreadcrumbItemRenderer = ({ item, currentPageLabel, siblingMenuLabel, maxLabelLength }: ItemRendererProps) => {
    const colors = useThemeColors();
    const Icon = item.icon;
    const isLink = !item.current && (item.href !== undefined || item.onSelect !== undefined);

    const effectiveMax = item.maxLabelLength ?? maxLabelLength;
    const renderLabel = (): ReactNode => {
        if (item.loading) {
            return (
                <View
                    style={{
                        backgroundColor: colors.semantic.background.subtle,
                        borderRadius: px(colors.radius.sm),
                        height: px(colors.fontSize.sm),
                        width: 64,
                    }}
                />
            );
        }
        if (typeof item.label === 'string' || typeof item.label === 'number') {
            const text = String(item.label);
            const truncated = effectiveMax > 0 ? truncateString(text, effectiveMax) : text;
            return (
                <RNText
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={{
                        fontFamily: colors.fontFamily.body,
                        fontSize: px(colors.fontSize.sm),
                        color: item.current ? colors.semantic.text.default : colors.semantic.text.muted,
                        fontWeight: item.current
                            ? (colors.fontWeight.semibold as '600')
                            : (colors.fontWeight.regular as '400'),
                    }}
                >
                    {truncated}
                </RNText>
            );
        }
        return item.label;
    };

    const inner = (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: px(colors.spacing['1']),
            }}
        >
            {Icon ? (
                <Icon size={14} color={item.current ? colors.semantic.text.default : colors.semantic.text.muted} />
            ) : null}
            {renderLabel()}
        </View>
    );

    if (item.current) {
        return (
            <View
                role="listitem"
                accessibilityRole="text"
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 }}
            >
                <RNText
                    style={{
                        position: 'absolute',
                        width: 1,
                        height: 1,
                        overflow: 'hidden',
                        opacity: 0,
                    }}
                >
                    {currentPageLabel}:{' '}
                </RNText>
                <View aria-current="page">{inner}</View>
            </View>
        );
    }

    if (item.siblings && item.siblings.length > 0) {
        return (
            <View role="listitem" style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 }}>
                <BreadcrumbInteractive item={item}>{inner}</BreadcrumbInteractive>
                <BreadcrumbSiblingMenu item={item} siblingMenuLabel={siblingMenuLabel} />
            </View>
        );
    }

    if (isLink) {
        return (
            <View role="listitem" style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 }}>
                <BreadcrumbInteractive item={item}>{inner}</BreadcrumbInteractive>
            </View>
        );
    }

    return (
        <View role="listitem" style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 }}>
            {inner}
        </View>
    );
};

const BreadcrumbInteractive = ({ item, children }: { item: BreadcrumbItemData; children: ReactNode }) => {
    const colors = useThemeColors();
    const handlePress = useCallback(() => {
        item.onSelect?.();
    }, [item]);

    if (Platform.OS === 'web' && item.href) {
        // When the consumer passes `onSelect`, treat it as the action and
        // suppress the default `<a>` navigation. This is the standard
        // pattern for "link-styled button" use-cases (router Links,
        // analytics-only handlers, demo pseudo-links).
        const handleClick = item.onSelect
            ? (event: { preventDefault: () => void }) => {
                  event.preventDefault();
                  item.onSelect?.();
              }
            : undefined;
        return (
            <a
                href={item.href}
                onClick={handleClick}
                style={{
                    color: colors.semantic.interactive.primary,
                    textDecoration: 'none',
                    fontFamily: colors.fontFamily.body,
                }}
            >
                {children}
            </a>
        );
    }

    return (
        <Pressable onPress={handlePress} accessibilityRole="link" role="link">
            {children}
        </Pressable>
    );
};

const BreadcrumbSiblingMenu = ({ item, siblingMenuLabel }: { item: BreadcrumbItemData; siblingMenuLabel: string }) => {
    const colors = useThemeColors();
    const siblings = item.siblings ?? [];
    return (
        <Popover>
            <Popover.Trigger asChild={false}>
                <View
                    accessibilityLabel={siblingMenuLabel}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 2,
                        paddingVertical: 4,
                    }}
                >
                    <RNText
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                        style={{ fontSize: 10, color: colors.semantic.text.muted }}
                    >
                        ▾
                    </RNText>
                </View>
            </Popover.Trigger>
            <Popover.Content side="bottom" align="start">
                <View style={{ minWidth: 200, paddingVertical: 4 }}>
                    {siblings.map((sib, idx) => (
                        <SiblingRow key={sib.href ?? idx} sibling={sib} />
                    ))}
                </View>
            </Popover.Content>
        </Popover>
    );
};

const SiblingRow = ({ sibling }: { sibling: BreadcrumbSibling }) => {
    const colors = useThemeColors();
    const Icon = sibling.icon;
    const handlePress = useCallback(() => {
        sibling.onSelect?.();
    }, [sibling]);

    const inner = (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: px(colors.spacing['2']),
                paddingVertical: px(colors.spacing['2']),
                paddingHorizontal: px(colors.spacing['3']),
                opacity: sibling.disabled ? 0.5 : 1,
            }}
        >
            {Icon ? <Icon size={14} color={colors.semantic.text.muted} /> : null}
            {typeof sibling.label === 'string' || typeof sibling.label === 'number' ? (
                <RNText
                    style={{
                        fontFamily: colors.fontFamily.body,
                        fontSize: px(colors.fontSize.sm),
                        color: colors.semantic.text.default,
                    }}
                >
                    {String(sibling.label)}
                </RNText>
            ) : (
                sibling.label
            )}
        </View>
    );

    if (Platform.OS === 'web' && sibling.href && !sibling.disabled) {
        const handleClick = sibling.onSelect
            ? (event: { preventDefault: () => void }) => {
                  event.preventDefault();
                  sibling.onSelect?.();
              }
            : undefined;
        return (
            <a href={sibling.href} onClick={handleClick} style={{ textDecoration: 'none', color: 'inherit' }}>
                {inner}
            </a>
        );
    }
    return (
        <Pressable onPress={sibling.disabled ? undefined : handlePress} accessibilityRole="menuitem">
            {inner}
        </Pressable>
    );
};

// =============================================================================
// Ellipsis (internal — used by the items-mode renderer)
// =============================================================================

type EllipsisProps = {
    ellipsisLabel: string;
    expandLabel: string;
    expandBehavior: BreadcrumbExpandBehavior;
    hiddenItems: ReadonlyArray<BreadcrumbItemData>;
    onExpandInline: () => void;
};

const BreadcrumbEllipsisInternal = ({
    ellipsisLabel,
    expandLabel,
    expandBehavior,
    hiddenItems,
    onExpandInline,
}: EllipsisProps) => {
    const colors = useThemeColors();
    const renderDots = () => (
        <RNText
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{
                fontFamily: colors.fontFamily.body,
                fontSize: px(colors.fontSize.sm),
                color: colors.semantic.text.muted,
                paddingHorizontal: 4,
            }}
        >
            …
        </RNText>
    );

    if (expandBehavior === 'none' || hiddenItems.length === 0) {
        return (
            <View
                accessibilityLabel={ellipsisLabel}
                aria-label={ellipsisLabel}
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 }}
            >
                {renderDots()}
            </View>
        );
    }

    if (expandBehavior === 'inline') {
        return (
            <Pressable
                onPress={onExpandInline}
                accessibilityRole="button"
                role="button"
                accessibilityLabel={expandLabel}
                aria-label={expandLabel}
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 }}
            >
                {renderDots()}
            </Pressable>
        );
    }

    // Menu mode: ellipsis triggers a popover with the hidden items.
    return (
        <Popover>
            <Popover.Trigger asChild={false}>
                <View
                    accessibilityLabel={expandLabel}
                    aria-label={expandLabel}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 }}
                >
                    {renderDots()}
                </View>
            </Popover.Trigger>
            <Popover.Content side="bottom" align="start">
                <View style={{ minWidth: 200, paddingVertical: 4 }}>
                    {hiddenItems.map((it, idx) => {
                        const sib: BreadcrumbSibling = { label: it.label };
                        if (it.href !== undefined) {
                            sib.href = it.href;
                        }
                        if (it.icon !== undefined) {
                            sib.icon = it.icon;
                        }
                        if (it.onSelect !== undefined) {
                            sib.onSelect = it.onSelect;
                        }
                        return (
                            <SiblingRow
                                key={typeof it.key === 'string' || typeof it.key === 'number' ? it.key : idx}
                                sibling={sib}
                            />
                        );
                    })}
                </View>
            </Popover.Content>
        </Popover>
    );
};

// =============================================================================
// Compound subcomponents
// =============================================================================

export type BreadcrumbListProps = {
    children?: ReactNode;
    className?: string;
    testID?: string;
};

const BreadcrumbList = ({ children, className, testID }: BreadcrumbListProps) => {
    useBreadcrumbContext('Breadcrumb.List');
    // Auto-insert separators between consecutive `Breadcrumb.Item`s
    // unless the user provided their own. Lets users write the terse form:
    //   <List><Item/><Item/><Item/></List>
    const childArray = Children.toArray(children);
    const out: ReactNode[] = [];
    let lastWasItem = false;
    childArray.forEach((child, idx) => {
        const kind = getCompoundKind(child);
        if (kind === 'item') {
            if (lastWasItem) {
                out.push(
                    // biome-ignore lint/suspicious/noArrayIndexKey: separator position is deterministic from its preceding item index
                    <Fragment key={`__autosep_${idx}`}>
                        <BreadcrumbSeparator />
                    </Fragment>
                );
            }
            out.push(child);
            lastWasItem = true;
        } else {
            out.push(child);
            lastWasItem = false;
        }
    });

    return (
        <View
            {...(testID !== undefined ? { testID } : {})}
            role="list"
            accessibilityRole="list"
            className={cn('flex-row items-center', className)}
            style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1, minWidth: 0 }}
        >
            {out}
        </View>
    );
};

export type BreadcrumbItemProps = {
    children?: ReactNode;
    className?: string;
    testID?: string;
};

const BreadcrumbItem = ({ children, className, testID }: BreadcrumbItemProps) => {
    useBreadcrumbContext('Breadcrumb.Item');
    return (
        <View
            {...(testID !== undefined ? { testID } : {})}
            role="listitem"
            accessibilityRole="text"
            className={cn('flex-row items-center', className)}
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 }}
        >
            {children}
        </View>
    );
};
tagComponent(BreadcrumbItem, 'item');

export type BreadcrumbLinkProps = {
    href?: string;
    onPress?: () => void;
    asChild?: boolean;
    children?: ReactNode;
    className?: string;
    testID?: string;
};

const BreadcrumbLink = ({ href, onPress, asChild, children, className, testID }: BreadcrumbLinkProps) => {
    const colors = useThemeColors();

    if (asChild) {
        return (
            <Slot
                {...(testID !== undefined ? { 'data-testid': testID } : {})}
                {...(className !== undefined ? { className } : {})}
            >
                {children}
            </Slot>
        );
    }

    if (Platform.OS === 'web' && href) {
        // `onPress` overrides the default `<a>` navigation — same pattern
        // as the items-mode `onSelect`. Lets consumers use `<Link>` from
        // a router or build pseudo-links for demos.
        const handleClick = onPress
            ? (event: { preventDefault: () => void }) => {
                  event.preventDefault();
                  onPress?.();
              }
            : undefined;
        return (
            <a
                href={href}
                onClick={handleClick}
                {...(testID !== undefined ? { 'data-testid': testID } : {})}
                {...(className !== undefined ? { className } : {})}
                style={{
                    color: colors.semantic.interactive.primary,
                    textDecoration: 'none',
                    fontFamily: colors.fontFamily.body,
                    fontSize: px(colors.fontSize.sm),
                }}
            >
                {typeof children === 'string' || typeof children === 'number' ? (
                    <RNText
                        style={{
                            color: colors.semantic.interactive.primary,
                            fontFamily: colors.fontFamily.body,
                            fontSize: px(colors.fontSize.sm),
                        }}
                    >
                        {children}
                    </RNText>
                ) : (
                    children
                )}
            </a>
        );
    }

    return (
        <Pressable onPress={onPress} accessibilityRole="link" role="link" {...(testID !== undefined ? { testID } : {})}>
            {typeof children === 'string' || typeof children === 'number' ? (
                <RNText
                    style={{
                        color: colors.semantic.interactive.primary,
                        fontFamily: colors.fontFamily.body,
                        fontSize: px(colors.fontSize.sm),
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

export type BreadcrumbPageProps = {
    children?: ReactNode;
    className?: string;
    testID?: string;
};

const BreadcrumbPage = ({ children, className, testID }: BreadcrumbPageProps) => {
    const ctx = useBreadcrumbContext('Breadcrumb.Page');
    const colors = useThemeColors();
    return (
        <View
            {...(testID !== undefined ? { testID } : {})}
            accessibilityRole="text"
            aria-current="page"
            className={cn('flex-row items-center', className)}
            style={{ flexDirection: 'row', alignItems: 'center' }}
        >
            <RNText
                style={{
                    position: 'absolute',
                    width: 1,
                    height: 1,
                    overflow: 'hidden',
                    opacity: 0,
                }}
            >
                {ctx.currentPageLabel}:{' '}
            </RNText>
            {typeof children === 'string' || typeof children === 'number' ? (
                <RNText
                    numberOfLines={1}
                    style={{
                        color: colors.semantic.text.default,
                        fontFamily: colors.fontFamily.body,
                        fontSize: px(colors.fontSize.sm),
                        fontWeight: colors.fontWeight.semibold as '600',
                    }}
                >
                    {children}
                </RNText>
            ) : (
                children
            )}
        </View>
    );
};

export type BreadcrumbSeparatorProps = {
    children?: ReactNode;
    className?: string;
    testID?: string;
};

const BreadcrumbSeparator = ({ children, className, testID }: BreadcrumbSeparatorProps) => {
    const ctx = useBreadcrumbContext('Breadcrumb.Separator');
    const node = children ?? renderSeparator(ctx.separator, { fromIndex: 0, visibleCount: 0, dir: ctx.dir });
    return (
        <View
            {...(testID !== undefined ? { testID } : {})}
            aria-hidden
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            role="presentation"
            className={cn('flex-row items-center', className)}
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 2 }}
        >
            {node}
        </View>
    );
};
tagComponent(BreadcrumbSeparator, 'separator');

export type BreadcrumbEllipsisProps = {
    ellipsisLabel?: string;
    className?: string;
    testID?: string;
};

const BreadcrumbEllipsis = ({ ellipsisLabel, className, testID }: BreadcrumbEllipsisProps) => {
    useBreadcrumbContext('Breadcrumb.Ellipsis');
    const { t } = useTranslation();
    const colors = useThemeColors();
    const label = ellipsisLabel ?? t('breadcrumb.ellipsisLabel', { defaultValue: 'More' });
    return (
        <View
            {...(testID !== undefined ? { testID } : {})}
            accessibilityLabel={label}
            aria-label={label}
            className={cn('flex-row items-center', className)}
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 }}
        >
            <RNText
                style={{
                    fontFamily: colors.fontFamily.body,
                    fontSize: px(colors.fontSize.sm),
                    color: colors.semantic.text.muted,
                }}
            >
                …
            </RNText>
        </View>
    );
};

// =============================================================================
// Public surface
// =============================================================================

export const Breadcrumb = Object.assign(BreadcrumbRoot, {
    List: BreadcrumbList,
    Item: BreadcrumbItem,
    Link: BreadcrumbLink,
    Page: BreadcrumbPage,
    Separator: BreadcrumbSeparator,
    Ellipsis: BreadcrumbEllipsis,
});
