'use client';

import {
    type ChangeEvent,
    type KeyboardEvent,
    type ReactNode,
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';
import type { NativeScrollEvent, NativeSyntheticEvent, ViewStyle } from 'react-native';
import { Modal, Platform, Pressable, Text as RNText, ScrollView, useWindowDimensions, View } from 'react-native';
import { defaultSemanticIcons } from '../../icons/default-semantic-icons';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';

export type SelectOption<T = unknown> = {
    /** Unique value within the select. */
    value: string;
    /** Visible text. */
    label: string;
    /** Optional group label — items with the same `group` cluster together. */
    group?: string;
    disabled?: boolean;
    /** Arbitrary payload — surfaced to `renderOption` and `onChange`. */
    data?: T;
};

export type LoadOptionsParams = {
    /** Current search input. */
    search: string;
    /** Number of items already loaded — start of the requested window. */
    offset: number;
    /** Page size requested. */
    limit: number;
};

export type LoadOptionsResult<T = unknown> = {
    items: ReadonlyArray<SelectOption<T>>;
    /** Total available — the picker stops requesting when offset+items.length >= total. Optional; if omitted, requests stop when items.length < limit. */
    total?: number;
};

export type SelectRenderOptionInfo = {
    /** This option matches the current value. */
    selected: boolean;
    /** This option is the keyboard focus target. */
    active: boolean;
};

type SelectBaseProps<T = unknown> = {
    /** Static options. Mutually exclusive with `loadOptions`. */
    options?: ReadonlyArray<SelectOption<T>>;
    /**
     * Async loader. Called with `{ search, offset, limit }` whenever the
     * search input changes (debounced) or the user scrolls near the end of
     * the loaded list. Return more items + an optional total to stop the
     * pagination loop early.
     */
    loadOptions?: (params: LoadOptionsParams) => Promise<LoadOptionsResult<T>>;
    /** Page size for `loadOptions`. @defaultValue 50 */
    pageSize?: number;
    /** Show a search input above the list. @defaultValue auto-on for static options >= 10 items, always on for loadOptions */
    searchable?: boolean;
    /** Placeholder for the search input. */
    searchPlaceholder?: string;
    /** Override the default substring filter for static options. */
    filterOption?: (option: SelectOption<T>, search: string) => boolean;
    /** Custom item renderer. Called per option in the list. */
    renderOption?: (option: SelectOption<T>, info: SelectRenderOptionInfo) => ReactNode;
    /** Trigger placeholder when no value is selected. */
    placeholder?: string;
    /**
     * BCP 47 locale — drives `Intl.Collator` sorting of options when set.
     * Re-sorts on language switch so a German list reads alphabetically in
     * German vs the same list in English.
     */
    locale?: string;
    /** When `locale` is set, sort options alphabetically. @defaultValue true */
    sortByLocale?: boolean;
    /** Message shown in the popup when there are no matching options. */
    noOptionsMessage?: string;
    /** Message shown while async results are loading. */
    loadingMessage?: string;
    /** Disable interaction. */
    disabled?: boolean;
    /** RTL flips the popup alignment + text direction. */
    dir?: 'ltr' | 'rtl';
    /**
     * Virtualize the list — only DOM-render the visible window of items.
     * Auto-on when the list has more than 100 items.
     */
    virtualized?: boolean;
    /** Pixel height of a single item — required for virtualization math. @defaultValue 36 */
    itemHeight?: number;
    /** Max popup height in px. @defaultValue 320 */
    maxMenuHeight?: number;
    className?: string;
    testID?: string;
    'aria-label'?: string;
};

export type SelectSingleProps<T = unknown> = SelectBaseProps<T> & {
    /** Single-select mode (default — omit or pass `false`). */
    multiple?: false;
    /** Controlled value. */
    value?: string;
    /** Uncontrolled initial value. */
    defaultValue?: string;
    /** Fires when the user picks an option. */
    onChange?: (value: string, option: SelectOption<T> | undefined) => void;
};

export type SelectMultiProps<T = unknown> = SelectBaseProps<T> & {
    /** Multi-select mode — value/onChange become array-typed. */
    multiple: true;
    /** Controlled values. */
    value?: ReadonlyArray<string>;
    /** Uncontrolled initial values. */
    defaultValue?: ReadonlyArray<string>;
    /** Fires when the selection changes. Receives the full new array of values + their resolved options. */
    onChange?: (values: ReadonlyArray<string>, options: ReadonlyArray<SelectOption<T>>) => void;
    /** Hard cap on selected count — extra picks are ignored. */
    maxSelected?: number;
    /** Max chips to render in the trigger before collapsing to "N selected". @defaultValue 3 */
    maxChips?: number;
};

export type SelectProps<T = unknown> = SelectSingleProps<T> | SelectMultiProps<T>;

const DEFAULT_PAGE_SIZE = 50;
const DEFAULT_ITEM_HEIGHT = 36;
const DEFAULT_MAX_MENU = 320;
const SEARCH_DEBOUNCE_MS = 150;
const VIRTUAL_OVERSCAN = 4;

const defaultFilter = <T,>(option: SelectOption<T>, search: string): boolean => {
    if (!search) {
        return true;
    }
    return option.label.toLowerCase().includes(search.toLowerCase());
};

/**
 * Searchable, async-capable, optionally virtualized select. Designed for the
 * "I have 500 items behind a paginated API" case as easily as the "five
 * static items" case.
 *
 * Modes:
 *   - **Static** — pass `options`. The picker filters in-memory by a
 *     substring match on `label` (override via `filterOption`).
 *   - **Async** — pass `loadOptions(params)`. Called on search-input change
 *     (debounced) and when the list scrolls near the bottom for the next
 *     page. The picker manages the loaded list, so consumers don't have to.
 *
 * Other features:
 *   - Custom item renderer via `renderOption`.
 *   - i18n locale-aware sorting via `Intl.Collator` when `locale` is set —
 *     re-sorts when the locale changes so a German list reads
 *     alphabetically in German.
 *   - OptGroup support — items with the same `group` field cluster in the
 *     popup with a group header.
 *   - Virtualized list when item count > 100 (or set `virtualized`
 *     explicitly). Only the visible window is rendered.
 *   - Keyboard navigation: ArrowDown / ArrowUp move the active option,
 *     Enter selects, Escape closes, Tab closes and selects.
 *   - RTL alignment via `dir="rtl"`.
 */
export const Select = <T = unknown>(props: SelectProps<T>) => {
    const {
        options: staticOptions,
        loadOptions,
        pageSize = DEFAULT_PAGE_SIZE,
        searchable: searchableProp,
        searchPlaceholder = 'Search…',
        filterOption,
        renderOption,
        placeholder = 'Select…',
        locale,
        sortByLocale = true,
        noOptionsMessage = 'No options',
        loadingMessage = 'Loading…',
        disabled = false,
        dir = 'ltr',
        virtualized: virtualizedProp,
        itemHeight = DEFAULT_ITEM_HEIGHT,
        maxMenuHeight = DEFAULT_MAX_MENU,
        className,
        testID,
    } = props;
    const ariaLabel = (props as { 'aria-label'?: string })['aria-label'];
    const multiple = props.multiple === true;
    const maxSelected = multiple ? (props as SelectMultiProps<T>).maxSelected : undefined;
    const maxChips = multiple ? ((props as SelectMultiProps<T>).maxChips ?? 3) : undefined;

    const baseId = useId();
    const colors = useThemeColors();
    const [open, setOpen] = useState(false);

    // We always store values as a ReadonlyArray<string> internally so the
    // toggle / replace logic stays uniform; for single mode the array is
    // either empty or has exactly one element.
    const controlledValues: ReadonlyArray<string> | undefined = multiple
        ? (props.value as ReadonlyArray<string> | undefined)
        : props.value !== undefined
          ? [props.value as string]
          : undefined;
    const defaultValues: ReadonlyArray<string> = multiple
        ? (((props as SelectMultiProps<T>).defaultValue as ReadonlyArray<string> | undefined) ?? [])
        : (props as SelectSingleProps<T>).defaultValue !== undefined
          ? [(props as SelectSingleProps<T>).defaultValue as string]
          : [];
    const [innerValues, setInnerValues] = useState<ReadonlyArray<string>>(defaultValues);
    const isControlled = controlledValues !== undefined;
    const currentValues: ReadonlyArray<string> = isControlled
        ? (controlledValues as ReadonlyArray<string>)
        : innerValues;
    /** Single-mode legacy accessor — first selected value (or undefined). */
    const current: string | undefined = currentValues[0];

    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);

    // Debounce the search input so loadOptions / filterOption don't fire on
    // every keystroke when the work is expensive.
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchInput), SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(t);
    }, [searchInput]);

    // Async-mode internal cache of loaded options.
    const [asyncItems, setAsyncItems] = useState<SelectOption<T>[]>([]);
    const [asyncLoading, setAsyncLoading] = useState(false);
    const [asyncTotal, setAsyncTotal] = useState<number | undefined>(undefined);
    const asyncRequestId = useRef(0);

    const isAsync = loadOptions !== undefined;

    // When the search changes in async mode, reset the loaded list and
    // refetch from offset 0. The request id guards against stale resolution.
    useEffect(() => {
        if (!isAsync || !loadOptions || !open) {
            return;
        }
        const requestId = ++asyncRequestId.current;
        setAsyncLoading(true);
        setAsyncItems([]);
        setAsyncTotal(undefined);
        loadOptions({ search: debouncedSearch, offset: 0, limit: pageSize })
            .then((result) => {
                if (requestId !== asyncRequestId.current) {
                    return;
                }
                setAsyncItems(result.items.slice());
                setAsyncTotal(result.total);
            })
            .catch(() => {
                // Swallow — consumers can wrap loadOptions to handle errors.
            })
            .finally(() => {
                if (requestId === asyncRequestId.current) {
                    setAsyncLoading(false);
                }
            });
    }, [debouncedSearch, isAsync, loadOptions, pageSize, open]);

    // Helper to load the next page in async mode.
    const loadMore = useCallback(() => {
        if (!isAsync || !loadOptions || asyncLoading) {
            return;
        }
        const haveAll = asyncTotal !== undefined && asyncItems.length >= asyncTotal;
        if (haveAll) {
            return;
        }
        const requestId = ++asyncRequestId.current;
        setAsyncLoading(true);
        loadOptions({ search: debouncedSearch, offset: asyncItems.length, limit: pageSize })
            .then((result) => {
                if (requestId !== asyncRequestId.current) {
                    return;
                }
                setAsyncItems((prev) => prev.concat(result.items));
                if (result.total !== undefined) {
                    setAsyncTotal(result.total);
                }
            })
            .catch(() => undefined)
            .finally(() => {
                if (requestId === asyncRequestId.current) {
                    setAsyncLoading(false);
                }
            });
    }, [asyncItems.length, asyncLoading, asyncTotal, debouncedSearch, isAsync, loadOptions, pageSize]);

    // Build the displayed option list — filter (static) or async items, then
    // optionally locale-sort.
    const visibleOptions = useMemo<SelectOption<T>[]>(() => {
        const source = isAsync ? asyncItems : (staticOptions ?? []);
        const filtered = isAsync
            ? source.slice() // async backend already handled search
            : source.filter((opt) => (filterOption ?? defaultFilter)(opt, debouncedSearch));
        if (locale && sortByLocale) {
            const collator = new Intl.Collator(locale, { sensitivity: 'base', numeric: true });
            // Group-aware sort: stable on group, then on label.
            return filtered.slice().sort((a, b) => {
                const ga = a.group ?? '';
                const gb = b.group ?? '';
                const groupDelta = collator.compare(ga, gb);
                if (groupDelta !== 0) {
                    return groupDelta;
                }
                return collator.compare(a.label, b.label);
            });
        }
        return filtered;
    }, [isAsync, asyncItems, staticOptions, filterOption, debouncedSearch, locale, sortByLocale]);

    const selectedOption = useMemo(() => {
        const all = isAsync ? asyncItems : (staticOptions ?? []);
        return all.find((o) => o.value === current);
    }, [asyncItems, isAsync, staticOptions, current]);

    /** Multi-mode: resolved options for every currently-selected value, in selection order. */
    const selectedOptions = useMemo<ReadonlyArray<SelectOption<T>>>(() => {
        if (!multiple) {
            return [];
        }
        const all = isAsync ? asyncItems : (staticOptions ?? []);
        const map = new Map(all.map((o) => [o.value, o]));
        return currentValues.map((v) => map.get(v)).filter((o): o is SelectOption<T> => o !== undefined);
    }, [multiple, currentValues, asyncItems, isAsync, staticOptions]);

    const searchable = searchableProp ?? (isAsync || (staticOptions !== undefined && staticOptions.length >= 10));
    const virtualized = virtualizedProp ?? visibleOptions.length > 100;

    // Keep activeIndex in bounds.
    useEffect(() => {
        setActiveIndex((idx) => Math.min(Math.max(0, idx), Math.max(0, visibleOptions.length - 1)));
    }, [visibleOptions.length]);

    const onSelect = useCallback(
        (option: SelectOption<T>) => {
            if (option.disabled) {
                return;
            }
            if (multiple) {
                const has = currentValues.includes(option.value);
                let nextValues: string[];
                if (has) {
                    nextValues = currentValues.filter((v) => v !== option.value);
                } else {
                    if (maxSelected !== undefined && currentValues.length >= maxSelected) {
                        return; // hit the cap
                    }
                    nextValues = [...currentValues, option.value];
                }
                if (!isControlled) {
                    setInnerValues(nextValues);
                }
                // Resolve options for callback — preserves order of nextValues.
                const allOpts: ReadonlyArray<SelectOption<T>> = [
                    ...(staticOptions ?? []),
                    ...(asyncItems as ReadonlyArray<SelectOption<T>>),
                ];
                const optMap = new Map(allOpts.map((o) => [o.value, o]));
                const selectedOpts = nextValues
                    .map((v) => optMap.get(v))
                    .filter((o): o is SelectOption<T> => o !== undefined);
                (props as SelectMultiProps<T>).onChange?.(nextValues, selectedOpts);
                // Multi mode: keep the popup open, keep the search input — the
                // user is likely picking more than one in a row.
                return;
            }
            // Single mode — replace + close.
            if (!isControlled) {
                setInnerValues([option.value]);
            }
            (props as SelectSingleProps<T>).onChange?.(option.value, option);
            setOpen(false);
            setSearchInput('');
        },
        // biome-ignore lint/correctness/useExhaustiveDependencies: `props` is the discriminated union — destructuring it would defeat the narrowing; the asyncItems / staticOptions captures intentionally re-trigger the callback when the option pool changes
        [multiple, isControlled, currentValues, maxSelected, staticOptions, asyncItems, props]
    );

    /** Multi-mode helper to clear all selected values. */
    const clearAll = useCallback(() => {
        if (!isControlled) {
            setInnerValues([]);
        }
        (props as SelectMultiProps<T>).onChange?.([], []);
        // biome-ignore lint/correctness/useExhaustiveDependencies: same reason as above
    }, [isControlled, props]);

    const moveActive = useCallback(
        (delta: 1 | -1) => {
            setActiveIndex((idx) => {
                if (visibleOptions.length === 0) {
                    return 0;
                }
                let next = (idx + delta + visibleOptions.length) % visibleOptions.length;
                // Skip disabled options.
                for (let attempts = 0; attempts < visibleOptions.length; attempts += 1) {
                    if (!visibleOptions[next]?.disabled) {
                        return next;
                    }
                    next = (next + delta + visibleOptions.length) % visibleOptions.length;
                }
                return idx;
            });
        },
        [visibleOptions]
    );

    const handleSearchKeyDown = useCallback(
        (event: KeyboardEvent<HTMLInputElement>) => {
            switch (event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    moveActive(1);
                    return;
                case 'ArrowUp':
                    event.preventDefault();
                    moveActive(-1);
                    return;
                case 'Enter': {
                    const opt = visibleOptions[activeIndex];
                    if (opt) {
                        event.preventDefault();
                        onSelect(opt);
                    }
                    return;
                }
                case 'Escape':
                    event.preventDefault();
                    setOpen(false);
                    return;
                case 'Tab':
                    setOpen(false);
                    return;
            }
        },
        [moveActive, activeIndex, visibleOptions, onSelect]
    );

    const handleTriggerKeyDown = useCallback((event: KeyboardEvent<HTMLElement>) => {
        switch (event.key) {
            case ' ':
            case 'Enter':
            case 'ArrowDown':
                event.preventDefault();
                setOpen(true);
                return;
        }
    }, []);

    // Close when clicking outside (web only). The outside check considers
    // BOTH the container (trigger area) and the popup ref because the popup
    // portals out of the container's DOM subtree (position: fixed escapes
    // any overflow:hidden ancestor, but still belongs to the same logical
    // widget).
    const containerRef = useRef<HTMLDivElement | null>(null);
    const triggerRef = useRef<HTMLElement | null>(null);
    const popupRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (
            Platform.OS !== 'web' ||
            typeof document === 'undefined' ||
            typeof document.addEventListener !== 'function'
        ) {
            return;
        }
        if (!open) {
            return;
        }
        const onDocClick = (event: MouseEvent) => {
            const node = containerRef.current;
            const popup = popupRef.current;
            const target = event.target as Node;
            if (node?.contains(target)) {
                return;
            }
            if (popup?.contains(target)) {
                return;
            }
            setOpen(false);
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, [open]);

    // Measure the trigger so the popup can render with `position: fixed` +
    // computed coords. position:fixed escapes any ancestor's overflow:hidden
    // (e.g. fumadocs Tabs panes, our Preview frame), which is the
    // single biggest source of "the dropdown got cut off" bugs.
    //
    // On native we ignore the web `position:fixed` path entirely and
    // measure via `View.measure(...)` to feed an RN `<Modal>` positioned
    // absolutely below the trigger.
    const [triggerRect, setTriggerRect] = useState<{ top: number; left: number; width: number; height: number } | null>(
        null
    );
    const measureTrigger = useCallback(() => {
        const node = triggerRef.current as unknown as {
            getBoundingClientRect?: () => DOMRect;
            measure?: (cb: (x: number, y: number, w: number, h: number, pageX: number, pageY: number) => void) => void;
        } | null;
        if (!node) {
            return;
        }
        if (Platform.OS === 'web' && typeof node.getBoundingClientRect === 'function') {
            const rect = node.getBoundingClientRect();
            setTriggerRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
            return;
        }
        // Native path — RN's measure() reports page-relative coords on the UI thread.
        if (typeof node.measure === 'function') {
            node.measure((_x, _y, w, h, pageX, pageY) => {
                setTriggerRect({ top: pageY, left: pageX, width: w, height: h });
            });
        }
    }, []);
    useEffect(() => {
        if (!open) {
            return;
        }
        // `window` is defined on RN's Hermes/JSC runtime but `addEventListener`
        // is web-only; gate on Platform.OS to avoid the runtime crash on native.
        if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
            return;
        }
        measureTrigger();
        window.addEventListener('scroll', measureTrigger, true);
        window.addEventListener('resize', measureTrigger);
        return () => {
            window.removeEventListener('scroll', measureTrigger, true);
            window.removeEventListener('resize', measureTrigger);
        };
    }, [open, measureTrigger]);

    // Scroll handler for async pagination. ScrollView's onScroll event shape
    // works across both react-native-web (HTMLDivElement under the hood) and
    // native (RCTScrollView), so we read offsets from `nativeEvent`.
    const onListScroll = useCallback(
        (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            if (!isAsync) {
                return;
            }
            const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
            const remaining = contentSize.height - contentOffset.y - layoutMeasurement.height;
            if (remaining < itemHeight * 4) {
                loadMore();
            }
        },
        [isAsync, itemHeight, loadMore]
    );

    // ---------- visual styling ----------
    const triggerStyle: ViewStyle = {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: px(colors.spacing['2']),
        paddingHorizontal: px(colors.spacing['3']),
        paddingVertical: px(colors.spacing['2']),
        minHeight: 36, // component-density literal — not from theme
        borderWidth: 1,
        borderColor: colors.semantic.border.default,
        borderRadius: px(colors.radius.md),
        backgroundColor: colors.semantic.background.elevated,
        opacity: disabled ? 0.6 : 1,
    };

    // Web: position:fixed + computed coords from the trigger so the popup
    // can escape any ancestor with `overflow: hidden` (fumadocs Tabs, our
    // Preview frame, etc.). Width matches the trigger; widen to a 200px
    // floor for readability.
    //
    // Native: same coords, but on `position:'absolute'` inside the Modal —
    // RN doesn't have `position:'fixed'`, but Modal renders above all
    // content as a true overlay so absolute coords against the screen
    // window are correct.
    const winDims = useWindowDimensions();
    const popupStyle: ViewStyle = triggerRect
        ? {
              position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as unknown as 'absolute',
              top: triggerRect.top + triggerRect.height + px(colors.spacing['1']),
              left: dir === 'rtl' ? undefined : triggerRect.left,
              right:
                  dir === 'rtl'
                      ? Platform.OS === 'web' && typeof window !== 'undefined'
                          ? window.innerWidth - (triggerRect.left + triggerRect.width)
                          : winDims.width - (triggerRect.left + triggerRect.width)
                      : undefined,
              minWidth: Math.max(200, triggerRect.width),
              backgroundColor: colors.semantic.background.elevated,
              borderRadius: px(colors.radius.lg),
              borderWidth: 1,
              borderColor: colors.semantic.border.default,
              // 2147483646 (max int32 - 1) so we sit above any third-party
              // chrome (toasts, modals, dev banners) without picking a fight
              // for the very top slot. Combined with portaling to body below,
              // this also dodges any ancestor stacking context that would
              // otherwise trap our z-index inside a sibling preview frame.
              zIndex: 2147483646,
              ...({ boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)' } as ViewStyle),
          }
        : {
              // Trigger not yet measured — render off-screen until the
              // first measurement lands. Avoids a one-frame flash at (0,0).
              position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as unknown as 'absolute',
              top: -9999,
              left: -9999,
          };

    const containerProps: Record<string, unknown> = {
        ref: (node: HTMLDivElement | null) => {
            containerRef.current = node;
        },
        ...(testID !== undefined ? { testID } : {}),
        dir,
    };

    return (
        <View {...containerProps} className={cn('relative', className)} style={{ position: 'relative' }}>
            {/* RN's Pressable TS surface doesn't model onKeyDown / aria-haspopup; rn-web forwards them. Spread at the boundary. */}
            <Pressable
                ref={(node) => {
                    triggerRef.current = node as unknown as HTMLElement | null;
                }}
                {...({
                    onKeyDown: handleTriggerKeyDown,
                    role: 'combobox',
                    accessibilityRole: 'combobox',
                    'aria-expanded': open,
                    'aria-controls': `${baseId}-listbox`,
                    'aria-haspopup': 'listbox',
                    tabIndex: disabled ? -1 : 0,
                    ...(ariaLabel !== undefined ? { 'aria-label': ariaLabel, accessibilityLabel: ariaLabel } : {}),
                    ...(disabled ? { 'aria-disabled': true, disabled: true } : {}),
                } as Record<string, unknown>)}
                onPress={() => {
                    if (disabled) {
                        return;
                    }
                    // Re-measure on every press so the popup picks up
                    // post-scroll / rotation / keyboard-shifted positions.
                    measureTrigger();
                    setOpen((v) => !v);
                }}
                style={triggerStyle}
            >
                {multiple ? (
                    <MultiTriggerLabel options={selectedOptions} placeholder={placeholder} maxChips={maxChips ?? 3} />
                ) : (
                    <RNText
                        style={{
                            color: selectedOption ? colors.semantic.text.default : colors.semantic.text.muted,
                            fontFamily: colors.fontFamily.body,
                            fontSize: px(colors.fontSize.sm),
                            flex: 1,
                        }}
                        numberOfLines={1}
                    >
                        {selectedOption?.label ?? placeholder}
                    </RNText>
                )}
                <defaultSemanticIcons.chevronDown size={16} color={colors.semantic.text.muted} />
            </Pressable>

            {open ? renderPopup() : null}
        </View>
    );

    // Local helper so we can portal to <body> on web. Why: even with
    // position:fixed, an ancestor with `transform`, `filter`, or `will-change`
    // creates a containing block that traps fixed positioning AND a stacking
    // context that traps z-index. The docs preview frames trip both. Portaling
    // to body removes all ambiguity — the popup is a top-level sibling of
    // <body>'s other children. On native, RN doesn't have a portal here, so
    // we render in place; native overflow is rarely a clipping problem
    // because RN doesn't have stacking-context-creating CSS properties.
    function renderPopup(): React.ReactNode {
        const popup = (
            <View
                ref={(node) => {
                    popupRef.current = node as unknown as HTMLDivElement | null;
                }}
                {...({
                    role: 'listbox',
                    id: `${baseId}-listbox`,
                    ...(multiple ? { 'aria-multiselectable': true } : {}),
                } as Record<string, unknown>)}
                style={popupStyle}
            >
                {searchable ? (
                    <SearchInput
                        value={searchInput}
                        onChange={setSearchInput}
                        onKeyDown={handleSearchKeyDown}
                        placeholder={searchPlaceholder}
                        dir={dir}
                    />
                ) : null}
                {multiple && currentValues.length > 0 ? (
                    <MultiSelectionHeader count={currentValues.length} onClearAll={clearAll} />
                ) : null}
                <SelectList
                    options={visibleOptions}
                    activeIndex={activeIndex}
                    currentValue={current}
                    selectedValues={currentValues}
                    multiple={multiple}
                    onSelect={onSelect}
                    onActiveChange={setActiveIndex}
                    {...(renderOption !== undefined ? { renderOption } : {})}
                    itemHeight={itemHeight}
                    maxHeight={maxMenuHeight}
                    virtualized={virtualized}
                    loading={isAsync && asyncLoading}
                    loadingMessage={loadingMessage}
                    noOptionsMessage={noOptionsMessage}
                    listboxId={`${baseId}-listbox`}
                    onScroll={onListScroll}
                />
            </View>
        );
        if (Platform.OS === 'web' && typeof document !== 'undefined') {
            return createPortal(popup, document.body);
        }
        // Native: wrap in a transparent Modal so the popup renders above
        // all in-tree content (RN has no `position:'fixed'` and an
        // absolute child can't escape its parent's overflow). The
        // Modal's onRequestClose handles Android's hardware back button;
        // a transparent backdrop Pressable closes the popup on outside
        // tap (the equivalent of the document-mousedown handler on web).
        return (
            <Modal transparent visible animationType="fade" onRequestClose={() => setOpen(false)} statusBarTranslucent>
                <Pressable
                    onPress={() => setOpen(false)}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                    }}
                />
                {popup}
            </Modal>
        );
    }
};

// ---------- search input (web-native input wrapped in a pressable container) ----------

type SearchInputProps = {
    value: string;
    onChange: (next: string) => void;
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
    placeholder: string;
    dir: 'ltr' | 'rtl';
};

const SearchInput = ({ value, onChange, onKeyDown, placeholder, dir }: SearchInputProps) => {
    const colors = useThemeColors();
    const inputRef = useRef<HTMLInputElement | null>(null);
    useEffect(() => {
        // Auto-focus when the popup opens so the user can start typing.
        inputRef.current?.focus?.();
    }, []);
    return (
        <View
            style={{
                paddingHorizontal: px(colors.spacing['2']),
                paddingVertical: px(colors.spacing['2']),
                borderBottomWidth: 1,
                borderBottomColor: colors.semantic.border.default,
            }}
        >
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                dir={dir}
                aria-label="Search options"
                style={{
                    width: '100%',
                    // Inline `padding: '6px 8px'` shorthand intentionally kept as a
                    // string for the native HTML <input> — it's not an RN style prop.
                    padding: `${px(colors.spacing['2']) - 2}px ${px(colors.spacing['2'])}px`,
                    fontFamily: colors.fontFamily.body,
                    fontSize: px(colors.fontSize.sm),
                    color: colors.semantic.text.default,
                    backgroundColor: colors.semantic.background.elevated,
                    border: `1px solid ${colors.semantic.border.default}`,
                    borderRadius: px(colors.radius.sm),
                    outline: 'none',
                }}
            />
        </View>
    );
};

// ---------- list (with optional virtualization + group headers) ----------

type SelectListProps<T> = {
    options: ReadonlyArray<SelectOption<T>>;
    activeIndex: number;
    currentValue: string | undefined;
    selectedValues: ReadonlyArray<string>;
    multiple: boolean;
    onSelect: (option: SelectOption<T>) => void;
    onActiveChange: (index: number) => void;
    renderOption?: (option: SelectOption<T>, info: SelectRenderOptionInfo) => ReactNode;
    itemHeight: number;
    maxHeight: number;
    virtualized: boolean;
    loading: boolean;
    loadingMessage: string;
    noOptionsMessage: string;
    listboxId: string;
    onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

const SelectList = <T,>({
    options,
    activeIndex,
    currentValue,
    selectedValues,
    multiple,
    onSelect,
    onActiveChange,
    renderOption,
    itemHeight,
    maxHeight,
    virtualized,
    loading,
    loadingMessage,
    noOptionsMessage,
    listboxId,
    onScroll,
}: SelectListProps<T>) => {
    const colors = useThemeColors();
    const [scrollTop, setScrollTop] = useState(0);

    const totalHeight = options.length * itemHeight;
    const visibleStart = virtualized ? Math.max(0, Math.floor(scrollTop / itemHeight) - VIRTUAL_OVERSCAN) : 0;
    const visibleEnd = virtualized
        ? Math.min(options.length, Math.ceil((scrollTop + maxHeight) / itemHeight) + VIRTUAL_OVERSCAN)
        : options.length;

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (virtualized) {
            setScrollTop(event.nativeEvent.contentOffset.y);
        }
        onScroll(event);
    };

    if (loading && options.length === 0) {
        return (
            <View style={{ padding: px(colors.spacing['4']), alignItems: 'center' }}>
                <RNText
                    style={{
                        color: colors.semantic.text.muted,
                        fontFamily: colors.fontFamily.body,
                        fontSize: px(colors.fontSize.sm),
                    }}
                >
                    {loadingMessage}
                </RNText>
            </View>
        );
    }
    if (options.length === 0) {
        return (
            <View style={{ padding: px(colors.spacing['4']), alignItems: 'center' }}>
                <RNText
                    style={{
                        color: colors.semantic.text.muted,
                        fontFamily: colors.fontFamily.body,
                        fontSize: px(colors.fontSize.sm),
                    }}
                >
                    {noOptionsMessage}
                </RNText>
            </View>
        );
    }

    // Group headers: when consecutive options change `group`, insert a header.
    // For virtualized mode we still respect groups by including any header
    // that precedes the visible window's first item.
    const items: ReactNode[] = [];
    let lastGroup: string | undefined;
    for (let i = visibleStart; i < visibleEnd; i += 1) {
        const opt = options[i];
        if (!opt) {
            continue;
        }
        if (opt.group !== lastGroup && opt.group !== undefined) {
            items.push(
                <View
                    // biome-ignore lint/suspicious/noArrayIndexKey: group header position is stable for current visible window
                    key={`grp-${i}-${opt.group}`}
                    style={{
                        paddingHorizontal: px(colors.spacing['3']),
                        paddingTop: px(colors.spacing['2']),
                        paddingBottom: px(colors.spacing['1']),
                        position: virtualized ? 'absolute' : 'relative',
                        top: virtualized ? i * itemHeight - px(colors.spacing['4']) : undefined,
                        left: 0,
                        right: 0,
                    }}
                >
                    <RNText
                        style={{
                            color: colors.semantic.text.muted,
                            fontFamily: colors.fontFamily.body,
                            fontSize: 11, // group header — component-density literal — not from theme (smaller than xs)
                            fontWeight: colors.fontWeight.semibold as '600',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                        }}
                    >
                        {opt.group}
                    </RNText>
                </View>
            );
            lastGroup = opt.group;
        }
        const selected = multiple ? selectedValues.includes(opt.value) : opt.value === currentValue;
        const active = i === activeIndex;
        const itemNode = renderOption ? (
            renderOption(opt, { selected, active })
        ) : (
            <DefaultOptionRow option={opt} selected={selected} active={active} multiple={multiple} />
        );
        items.push(
            <Pressable
                // biome-ignore lint/suspicious/noArrayIndexKey: option position is stable in the visible window
                key={`opt-${i}-${opt.value}`}
                {...({
                    role: 'option',
                    accessibilityRole: 'none',
                    'aria-selected': selected,
                    onMouseEnter: () => onActiveChange(i),
                    ...(opt.disabled ? { 'aria-disabled': true, disabled: true } : {}),
                } as Record<string, unknown>)}
                onPress={() => onSelect(opt)}
                style={{
                    position: virtualized ? 'absolute' : 'relative',
                    top: virtualized ? i * itemHeight : undefined,
                    left: 0,
                    right: 0,
                    height: itemHeight,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: px(colors.spacing['3']),
                    backgroundColor: active ? colors.semantic.background.subtle : 'transparent',
                    opacity: opt.disabled ? 0.5 : 1,
                }}
            >
                {itemNode}
            </Pressable>
        );
    }

    // ScrollView is the cross-platform container — react-native-web emits
    // scroll events with the same `nativeEvent.contentOffset` shape as
    // native, so the handler is identical on both. Web also gets the
    // `nativeID` prop mapped to the underlying div's `id` for a11y.
    return (
        <ScrollView
            nativeID={listboxId}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={{ maxHeight }}
            contentContainerStyle={virtualized ? { height: totalHeight, position: 'relative' } : undefined}
        >
            {items}
        </ScrollView>
    );
};

const DefaultOptionRow = <T,>({
    option,
    selected,
    active,
    multiple = false,
}: {
    option: SelectOption<T>;
    selected: boolean;
    active: boolean;
    multiple?: boolean;
}) => {
    const colors = useThemeColors();
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: px(colors.spacing['2']) }}>
            {multiple ? (
                // Inline checkbox-style indicator. We don't reuse <Checkbox>
                // here because the row is already a Pressable — nesting two
                // pressable surfaces breaks tap handling on native; this
                // is purely visual (the Pressable parent owns the toggle).
                <View
                    aria-hidden
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    style={{
                        width: 18,
                        height: 18,
                        borderWidth: 1,
                        borderRadius: px(colors.radius.sm),
                        borderColor: selected ? colors.semantic.interactive.primary : colors.semantic.border.strong,
                        backgroundColor: selected ? colors.semantic.interactive.primary : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {selected ? <defaultSemanticIcons.check size={12} color={colors.semantic.text.inverted} /> : null}
                </View>
            ) : null}
            <RNText
                style={{
                    color: colors.semantic.text.default,
                    fontFamily: colors.fontFamily.body,
                    fontSize: px(colors.fontSize.sm),
                    fontWeight: selected ? (colors.fontWeight.semibold as '600') : (colors.fontWeight.regular as '400'),
                    flex: 1,
                }}
                numberOfLines={1}
            >
                {option.label}
            </RNText>
            {selected && !multiple ? (
                <defaultSemanticIcons.check size={16} color={colors.semantic.interactive.primary} />
            ) : null}
            {/* keep `active` referenced — it's part of the public API consumers see via renderOption */}
            {active ? null : null}
        </View>
    );
};

// ---------- multi-select trigger label (chips with overflow) ----------

const MultiTriggerLabel = <T,>({
    options,
    placeholder,
    maxChips,
}: {
    options: ReadonlyArray<SelectOption<T>>;
    placeholder: string;
    maxChips: number;
}) => {
    const colors = useThemeColors();
    if (options.length === 0) {
        return (
            <RNText
                style={{
                    color: colors.semantic.text.muted,
                    fontFamily: colors.fontFamily.body,
                    fontSize: px(colors.fontSize.sm),
                    flex: 1,
                }}
                numberOfLines={1}
            >
                {placeholder}
            </RNText>
        );
    }
    // When the selection grows beyond `maxChips`, collapse to a counter so
    // the trigger height stays stable on narrow screens.
    if (options.length > maxChips) {
        return (
            <RNText
                style={{
                    color: colors.semantic.text.default,
                    fontFamily: colors.fontFamily.body,
                    fontSize: px(colors.fontSize.sm),
                    fontWeight: colors.fontWeight.medium as '500',
                    fontVariant: ['tabular-nums'],
                    flex: 1,
                }}
                numberOfLines={1}
            >
                {options.length} selected
            </RNText>
        );
    }
    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                flexWrap: 'wrap',
                rowGap: px(colors.spacing['1']),
                columnGap: px(colors.spacing['1']),
                flex: 1,
            }}
        >
            {options.map((opt) => (
                <View
                    key={`chip-${opt.value}`}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: px(colors.spacing['2']),
                        paddingVertical: 2,
                        borderRadius: px(colors.radius.sm),
                        backgroundColor: colors.semantic.background.subtle,
                        borderWidth: 1,
                        borderColor: colors.semantic.border.default,
                    }}
                >
                    <RNText
                        style={{
                            color: colors.semantic.text.default,
                            fontFamily: colors.fontFamily.body,
                            fontSize: px(colors.fontSize.sm),
                        }}
                        numberOfLines={1}
                    >
                        {opt.label}
                    </RNText>
                </View>
            ))}
        </View>
    );
};

// ---------- multi-select popup header with "Clear all" affordance ----------

const MultiSelectionHeader = ({ count, onClearAll }: { count: number; onClearAll: () => void }) => {
    const colors = useThemeColors();
    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: px(colors.spacing['3']),
                paddingVertical: px(colors.spacing['2']),
                borderBottomWidth: 1,
                borderBottomColor: colors.semantic.border.default,
            }}
        >
            <RNText
                style={{
                    color: colors.semantic.text.muted,
                    fontFamily: colors.fontFamily.body,
                    fontSize: px(colors.fontSize.sm),
                    fontVariant: ['tabular-nums'],
                }}
            >
                {count} selected
            </RNText>
            <Pressable
                role="button"
                accessibilityRole="button"
                aria-label="Clear all"
                accessibilityLabel="Clear all"
                onPress={onClearAll}
                style={({ pressed }) => ({
                    paddingHorizontal: px(colors.spacing['2']),
                    paddingVertical: 2,
                    borderRadius: px(colors.radius.sm),
                    opacity: pressed ? 0.6 : 1,
                })}
            >
                <RNText
                    style={{
                        color: colors.semantic.interactive.primary,
                        fontFamily: colors.fontFamily.body,
                        fontSize: px(colors.fontSize.sm),
                        fontWeight: colors.fontWeight.medium as '500',
                    }}
                >
                    Clear all
                </RNText>
            </Pressable>
        </View>
    );
};
