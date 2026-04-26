'use client';

import { theme } from '@nori-ui/tokens';
import {
    type ChangeEvent,
    type KeyboardEvent,
    type ReactNode,
    type UIEvent,
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from 'react';
import type { ViewStyle } from 'react-native';
import { Pressable, Text as RNText, View } from 'react-native';
import { defaultSemanticIcons } from '../../icons/default-semantic-icons';
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

export type SelectProps<T = unknown> = {
    /** Controlled value. */
    value?: string;
    /** Uncontrolled initial value. */
    defaultValue?: string;
    /** Fires when the user picks an option. */
    onChange?: (value: string, option: SelectOption<T> | undefined) => void;
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

const DEFAULT_PAGE_SIZE = 50;
const DEFAULT_ITEM_HEIGHT = 36;
const DEFAULT_MAX_MENU = 320;
const SEARCH_DEBOUNCE_MS = 150;
const VIRTUAL_OVERSCAN = 4;

const defaultFilter = <T,>(option: SelectOption<T>, search: string): boolean => {
    if (!search) return true;
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
export function Select<T = unknown>({
    value,
    defaultValue,
    onChange,
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
    ...rest
}: SelectProps<T>) {
    const ariaLabel = rest['aria-label'];
    const baseId = useId();
    const [open, setOpen] = useState(false);
    const [inner, setInner] = useState<string | undefined>(defaultValue);
    const isControlled = value !== undefined;
    const current = isControlled ? value : inner;

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
        if (!isAsync || !loadOptions || !open) return;
        const requestId = ++asyncRequestId.current;
        setAsyncLoading(true);
        setAsyncItems([]);
        setAsyncTotal(undefined);
        loadOptions({ search: debouncedSearch, offset: 0, limit: pageSize })
            .then((result) => {
                if (requestId !== asyncRequestId.current) return;
                setAsyncItems(result.items.slice());
                setAsyncTotal(result.total);
            })
            .catch(() => {
                // Swallow — consumers can wrap loadOptions to handle errors.
            })
            .finally(() => {
                if (requestId === asyncRequestId.current) setAsyncLoading(false);
            });
    }, [debouncedSearch, isAsync, loadOptions, pageSize, open]);

    // Helper to load the next page in async mode.
    const loadMore = useCallback(() => {
        if (!isAsync || !loadOptions || asyncLoading) return;
        const haveAll = asyncTotal !== undefined && asyncItems.length >= asyncTotal;
        if (haveAll) return;
        const requestId = ++asyncRequestId.current;
        setAsyncLoading(true);
        loadOptions({ search: debouncedSearch, offset: asyncItems.length, limit: pageSize })
            .then((result) => {
                if (requestId !== asyncRequestId.current) return;
                setAsyncItems((prev) => prev.concat(result.items));
                if (result.total !== undefined) setAsyncTotal(result.total);
            })
            .catch(() => undefined)
            .finally(() => {
                if (requestId === asyncRequestId.current) setAsyncLoading(false);
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
                if (groupDelta !== 0) return groupDelta;
                return collator.compare(a.label, b.label);
            });
        }
        return filtered;
    }, [isAsync, asyncItems, staticOptions, filterOption, debouncedSearch, locale, sortByLocale]);

    const selectedOption = useMemo(() => {
        const all = isAsync ? asyncItems : (staticOptions ?? []);
        return all.find((o) => o.value === current);
    }, [asyncItems, isAsync, staticOptions, current]);

    const searchable = searchableProp ?? (isAsync || (staticOptions !== undefined && staticOptions.length >= 10));
    const virtualized = virtualizedProp ?? visibleOptions.length > 100;

    // Keep activeIndex in bounds.
    useEffect(() => {
        setActiveIndex((idx) => Math.min(Math.max(0, idx), Math.max(0, visibleOptions.length - 1)));
    }, [visibleOptions.length]);

    const onSelect = useCallback(
        (option: SelectOption<T>) => {
            if (option.disabled) return;
            if (!isControlled) setInner(option.value);
            onChange?.(option.value, option);
            setOpen(false);
            setSearchInput('');
        },
        [isControlled, onChange]
    );

    const moveActive = useCallback(
        (delta: 1 | -1) => {
            setActiveIndex((idx) => {
                if (visibleOptions.length === 0) return 0;
                let next = (idx + delta + visibleOptions.length) % visibleOptions.length;
                // Skip disabled options.
                for (let attempts = 0; attempts < visibleOptions.length; attempts += 1) {
                    if (!visibleOptions[next]?.disabled) return next;
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

    // Close when clicking outside (web only).
    const containerRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (typeof document === 'undefined') return;
        if (!open) return;
        const onDocClick = (event: MouseEvent) => {
            const node = containerRef.current;
            if (!node) return;
            if (!node.contains(event.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, [open]);

    // Scroll handler for async pagination.
    const onListScroll = useCallback(
        (event: UIEvent<HTMLDivElement>) => {
            if (!isAsync) return;
            const node = event.currentTarget;
            const remaining = node.scrollHeight - node.scrollTop - node.clientHeight;
            if (remaining < itemHeight * 4) loadMore();
        },
        [isAsync, itemHeight, loadMore]
    );

    // ---------- visual styling ----------
    const triggerStyle: ViewStyle = {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        minHeight: 36,
        borderWidth: 1,
        borderColor: theme.semantic.border.default,
        borderRadius: 6,
        backgroundColor: theme.semantic.background.elevated,
        opacity: disabled ? 0.6 : 1,
    };

    const popupStyle: ViewStyle = {
        position: 'absolute',
        top: '100%' as unknown as number,
        left: dir === 'rtl' ? undefined : 0,
        right: dir === 'rtl' ? 0 : undefined,
        marginTop: 4,
        minWidth: 200,
        backgroundColor: theme.semantic.background.elevated,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.semantic.border.default,
        zIndex: 50,
        // rn-web maps `boxShadow` to the DOM div via inline style.
        ...({ boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)' } as ViewStyle),
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
                    if (disabled) return;
                    setOpen((v) => !v);
                }}
                style={triggerStyle}
            >
                <RNText
                    style={{
                        color: selectedOption ? theme.semantic.text.default : theme.color.neutral['400'],
                        fontSize: 14,
                        flex: 1,
                    }}
                    numberOfLines={1}
                >
                    {selectedOption?.label ?? placeholder}
                </RNText>
                <defaultSemanticIcons.chevronDown size={16} color={theme.color.neutral['500']} />
            </Pressable>

            {open ? (
                <View {...({ role: 'listbox', id: `${baseId}-listbox` } as Record<string, unknown>)} style={popupStyle}>
                    {searchable ? (
                        <SearchInput
                            value={searchInput}
                            onChange={setSearchInput}
                            onKeyDown={handleSearchKeyDown}
                            placeholder={searchPlaceholder}
                            dir={dir}
                        />
                    ) : null}
                    <SelectList
                        options={visibleOptions}
                        activeIndex={activeIndex}
                        currentValue={current}
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
            ) : null}
        </View>
    );
}

// ---------- search input (web-native input wrapped in a pressable container) ----------

type SearchInputProps = {
    value: string;
    onChange: (next: string) => void;
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
    placeholder: string;
    dir: 'ltr' | 'rtl';
};

function SearchInput({ value, onChange, onKeyDown, placeholder, dir }: SearchInputProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    useEffect(() => {
        // Auto-focus when the popup opens so the user can start typing.
        inputRef.current?.focus?.();
    }, []);
    return (
        <View
            style={{
                paddingHorizontal: 8,
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: theme.semantic.border.default,
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
                    padding: '6px 8px',
                    fontSize: 14,
                    border: `1px solid ${theme.semantic.border.default}`,
                    borderRadius: 4,
                    outline: 'none',
                }}
            />
        </View>
    );
}

// ---------- list (with optional virtualization + group headers) ----------

type SelectListProps<T> = {
    options: ReadonlyArray<SelectOption<T>>;
    activeIndex: number;
    currentValue: string | undefined;
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
    onScroll: (event: UIEvent<HTMLDivElement>) => void;
};

function SelectList<T>({
    options,
    activeIndex,
    currentValue,
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
}: SelectListProps<T>) {
    const [scrollTop, setScrollTop] = useState(0);

    const totalHeight = options.length * itemHeight;
    const visibleStart = virtualized ? Math.max(0, Math.floor(scrollTop / itemHeight) - VIRTUAL_OVERSCAN) : 0;
    const visibleEnd = virtualized
        ? Math.min(options.length, Math.ceil((scrollTop + maxHeight) / itemHeight) + VIRTUAL_OVERSCAN)
        : options.length;

    const handleScroll = (event: UIEvent<HTMLDivElement>) => {
        if (virtualized) setScrollTop(event.currentTarget.scrollTop);
        onScroll(event);
    };

    if (loading && options.length === 0) {
        return (
            <View style={{ padding: 16, alignItems: 'center' }}>
                <RNText style={{ color: theme.semantic.text.muted, fontSize: 14 }}>{loadingMessage}</RNText>
            </View>
        );
    }
    if (options.length === 0) {
        return (
            <View style={{ padding: 16, alignItems: 'center' }}>
                <RNText style={{ color: theme.semantic.text.muted, fontSize: 14 }}>{noOptionsMessage}</RNText>
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
        if (!opt) continue;
        if (opt.group !== lastGroup && opt.group !== undefined) {
            items.push(
                <View
                    // biome-ignore lint/suspicious/noArrayIndexKey: group header position is stable for current visible window
                    key={`grp-${i}-${opt.group}`}
                    style={{
                        paddingHorizontal: 12,
                        paddingTop: 8,
                        paddingBottom: 4,
                        position: virtualized ? 'absolute' : 'relative',
                        top: virtualized ? i * itemHeight - 16 : undefined,
                        left: 0,
                        right: 0,
                    }}
                >
                    <RNText
                        style={{
                            color: theme.semantic.text.muted,
                            fontSize: 11,
                            fontWeight: '600',
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
        const selected = opt.value === currentValue;
        const active = i === activeIndex;
        const itemNode = renderOption ? (
            renderOption(opt, { selected, active })
        ) : (
            <DefaultOptionRow option={opt} selected={selected} active={active} />
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
                    paddingHorizontal: 12,
                    backgroundColor: active ? theme.color.primary['50'] : 'transparent',
                    opacity: opt.disabled ? 0.5 : 1,
                }}
            >
                {itemNode}
            </Pressable>
        );
    }

    return (
        <div
            id={listboxId}
            onScroll={handleScroll}
            style={{
                maxHeight,
                overflowY: 'auto',
                position: 'relative',
            }}
        >
            <div style={virtualized ? { height: totalHeight, position: 'relative' } : undefined}>{items}</div>
        </div>
    );
}

function DefaultOptionRow<T>({
    option,
    selected,
    active,
}: {
    option: SelectOption<T>;
    selected: boolean;
    active: boolean;
}) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}>
            <RNText
                style={{
                    color: theme.semantic.text.default,
                    fontSize: 14,
                    fontWeight: selected ? '600' : '400',
                    flex: 1,
                }}
                numberOfLines={1}
            >
                {option.label}
            </RNText>
            {selected ? <defaultSemanticIcons.check size={16} color={theme.color.primary['600']} /> : null}
            {/* keep `active` referenced — it's part of the public API consumers see via renderOption */}
            {active ? null : null}
        </View>
    );
}
