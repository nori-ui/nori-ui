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
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ViewStyle } from 'react-native';
import {
    Modal,
    Platform,
    Pressable,
    Text as RNText,
    TextInput as RNTextInput,
    ScrollView,
    useWindowDimensions,
    View,
} from 'react-native';
import { useTranslation } from '../../i18n/use-translation';
import { defaultSemanticIcons } from '../../icons/default-semantic-icons';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';
import { useEscapeLayer } from '../../utils/overlay-layer-stack';
import { SelectPortal } from './SelectPortal';

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
    id?: string;
    name?: string;
    'aria-label'?: string;
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
    'aria-required'?: boolean;
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
// Reset window for the type-ahead buffer. Matches native <select> on macOS
// closely enough that typing "Sep" lands on September even without a search
// field. Shorter than the WAI-ARIA suggested 500ms feels jumpy on slow typists.
const TYPE_AHEAD_RESET_MS = 500;

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
 *     Home / End jump to the first / last, Enter selects, Escape closes,
 *     Tab closes. Type-ahead works whether or not a search field is shown
 *     (typing "Sep" lands on September; repeating a single char like
 *     "m","m" cycles through M-options).
 *   - RTL alignment via `dir="rtl"`.
 */
export const Select = <T = unknown>(props: SelectProps<T>) => {
    const {
        options: staticOptions,
        loadOptions,
        pageSize = DEFAULT_PAGE_SIZE,
        searchable: searchableProp,
        searchPlaceholder: searchPlaceholderProp,
        filterOption,
        renderOption,
        placeholder: placeholderProp,
        locale,
        sortByLocale = true,
        noOptionsMessage: noOptionsMessageProp,
        loadingMessage: loadingMessageProp,
        disabled = false,
        dir = 'ltr',
        virtualized: virtualizedProp,
        itemHeight = DEFAULT_ITEM_HEIGHT,
        maxMenuHeight = DEFAULT_MAX_MENU,
        className,
        testID,
        id,
        name,
    } = props;
    const ariaLabel = (props as { 'aria-label'?: string })['aria-label'];
    const ariaLabelledBy = (props as { 'aria-labelledby'?: string })['aria-labelledby'];
    const ariaDescribedBy = (props as { 'aria-describedby'?: string })['aria-describedby'];
    const ariaInvalid = (props as { 'aria-invalid'?: boolean })['aria-invalid'];
    const ariaRequired = (props as { 'aria-required'?: boolean })['aria-required'];
    const multiple = props.multiple === true;
    const maxSelected = multiple ? (props as SelectMultiProps<T>).maxSelected : undefined;
    const maxChips = multiple ? ((props as SelectMultiProps<T>).maxChips ?? 3) : undefined;

    const baseId = useId();
    const listboxId = `${baseId}-listbox`;
    const colors = useThemeColors();
    const { t } = useTranslation();
    const searchPlaceholder = searchPlaceholderProp ?? t('select.searchPlaceholder');
    const placeholder = placeholderProp ?? t('select.placeholder');
    const noOptionsMessage = noOptionsMessageProp ?? t('select.noOptions');
    const loadingMessage = loadingMessageProp ?? t('select.loading');
    const [open, setOpen] = useState(false);
    // Joins the shared overlay stack so Escape closes only this popup, not a
    // Dialog or Sheet the Select sits in.
    useEscapeLayer(open, () => setOpen(false));

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

    // Read the loader through a ref so an inline `loadOptions={...}` (a new
    // function identity on every parent render) does not restart the fetch.
    const loadOptionsRef = useRef(loadOptions);
    useEffect(() => {
        loadOptionsRef.current = loadOptions;
    });

    // Every option the loader has ever returned, keyed by value. The visible
    // page list is cleared on each open / search, so selected labels, chips
    // and the `onChange` payload resolve from here instead.
    const [knownOptions, setKnownOptions] = useState<ReadonlyMap<string, SelectOption<T>>>(() => new Map());
    const rememberOptions = useCallback((items: ReadonlyArray<SelectOption<T>>) => {
        if (items.length === 0) {
            return;
        }
        setKnownOptions((prev) => {
            const next = new Map(prev);
            for (const item of items) {
                next.set(item.value, item);
            }
            return next;
        });
    }, []);

    // When the search changes in async mode, reset the loaded list and
    // refetch from offset 0. The request id guards against stale resolution.
    useEffect(() => {
        const load = loadOptionsRef.current;
        if (!isAsync || !load || !open) {
            return;
        }
        const requestId = ++asyncRequestId.current;
        setAsyncLoading(true);
        setAsyncItems([]);
        setAsyncTotal(undefined);
        load({ search: debouncedSearch, offset: 0, limit: pageSize })
            .then((result) => {
                if (requestId !== asyncRequestId.current) {
                    return;
                }
                setAsyncItems(result.items.slice());
                setAsyncTotal(result.total);
                rememberOptions(result.items);
            })
            .catch(() => {
                // Swallow — consumers can wrap loadOptions to handle errors.
            })
            .finally(() => {
                if (requestId === asyncRequestId.current) {
                    setAsyncLoading(false);
                }
            });
    }, [debouncedSearch, isAsync, pageSize, open, rememberOptions]);

    // A value set before the popup was ever opened has no label yet. Fetch the
    // first page once per unresolved value so the trigger can show it; values
    // beyond that page stay unresolved until the user loads them.
    const labelLookupAttempts = useRef(new Set<string>());
    useEffect(() => {
        const load = loadOptionsRef.current;
        if (!isAsync || !load || open) {
            return;
        }
        const unresolved = currentValues.filter(
            (value) => !knownOptions.has(value) && !labelLookupAttempts.current.has(value)
        );
        if (unresolved.length === 0) {
            return;
        }
        for (const value of unresolved) {
            labelLookupAttempts.current.add(value);
        }
        load({ search: '', offset: 0, limit: pageSize })
            .then((result) => rememberOptions(result.items))
            .catch(() => undefined);
    }, [isAsync, open, currentValues, knownOptions, pageSize, rememberOptions]);

    // Helper to load the next page in async mode.
    const loadMore = useCallback(() => {
        const load = loadOptionsRef.current;
        if (!isAsync || !load || asyncLoading) {
            return;
        }
        const haveAll = asyncTotal !== undefined && asyncItems.length >= asyncTotal;
        if (haveAll) {
            return;
        }
        const requestId = ++asyncRequestId.current;
        setAsyncLoading(true);
        load({ search: debouncedSearch, offset: asyncItems.length, limit: pageSize })
            .then((result) => {
                if (requestId !== asyncRequestId.current) {
                    return;
                }
                setAsyncItems((prev) => prev.concat(result.items));
                rememberOptions(result.items);
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
    }, [asyncItems.length, asyncLoading, asyncTotal, debouncedSearch, isAsync, pageSize, rememberOptions]);

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

    /** Value → option lookup used to resolve labels for the current selection. */
    const optionByValue = useMemo<ReadonlyMap<string, SelectOption<T>>>(() => {
        if (isAsync) {
            return knownOptions;
        }
        const map = new Map<string, SelectOption<T>>();
        for (const option of staticOptions ?? []) {
            if (!map.has(option.value)) {
                map.set(option.value, option);
            }
        }
        return map;
    }, [isAsync, knownOptions, staticOptions]);

    const selectedOption = current !== undefined ? optionByValue.get(current) : undefined;

    /** Multi-mode: resolved options for every currently-selected value, in selection order. */
    const selectedOptions = useMemo<ReadonlyArray<SelectOption<T>>>(() => {
        if (!multiple) {
            return [];
        }
        return currentValues.map((v) => optionByValue.get(v)).filter((o): o is SelectOption<T> => o !== undefined);
    }, [multiple, currentValues, optionByValue]);

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
                const selectedOpts = nextValues
                    .map((v) => (v === option.value ? option : optionByValue.get(v)))
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
        [multiple, isControlled, currentValues, maxSelected, optionByValue, props]
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

    // Type-ahead buffer — shared across the trigger (closed state) and the
    // popup container (open without search field). Mutable ref so we don't
    // re-render on every keystroke.
    const typeAheadRef = useRef<{ buffer: string; timer: ReturnType<typeof setTimeout> | null }>({
        buffer: '',
        timer: null,
    });
    useEffect(() => {
        // Clear any pending type-ahead timer on unmount so we don't leak it.
        return () => {
            if (typeAheadRef.current.timer) {
                clearTimeout(typeAheadRef.current.timer);
                typeAheadRef.current.timer = null;
            }
        };
    }, []);

    const handleTypeAhead = useCallback(
        (char: string) => {
            if (visibleOptions.length === 0) {
                return;
            }
            if (typeAheadRef.current.timer) {
                clearTimeout(typeAheadRef.current.timer);
            }
            const nextBuffer = typeAheadRef.current.buffer + char.toLowerCase();
            typeAheadRef.current.buffer = nextBuffer;
            typeAheadRef.current.timer = setTimeout(() => {
                typeAheadRef.current.buffer = '';
                typeAheadRef.current.timer = null;
            }, TYPE_AHEAD_RESET_MS);

            // Cycle mode: a single char OR repeated same char (e.g. "aa") cycles
            // through options whose label starts with that char, advancing past
            // the current activeIndex. Otherwise the buffer is treated as a
            // prefix and we search from the top — refining the match as the
            // user keeps typing ("S" → "Se" → "Sep" → September).
            const allSame = nextBuffer.length > 1 && nextBuffer.split('').every((c) => c === nextBuffer[0]);
            const cycleMode = nextBuffer.length === 1 || allSame;
            const needle = cycleMode ? nextBuffer.charAt(0) : nextBuffer;
            const len = visibleOptions.length;
            const startFrom = cycleMode ? (activeIndex + 1) % len : 0;
            for (let i = 0; i < len; i += 1) {
                const idx = (startFrom + i) % len;
                const opt = visibleOptions[idx];
                if (!opt || opt.disabled) {
                    continue;
                }
                if (opt.label.toLowerCase().startsWith(needle)) {
                    setActiveIndex(idx);
                    return;
                }
            }
        },
        [visibleOptions, activeIndex]
    );

    // Shared list-navigation handler — used by the search input, the
    // popup container (when no search field is shown), and as the basis for
    // trigger handling. Returns true if the event was consumed so callers
    // can fall through to type-ahead handling for unhandled keys.
    const handleListKeyDown = useCallback(
        (event: KeyboardEvent<HTMLElement>): boolean => {
            switch (event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    moveActive(1);
                    return true;
                case 'ArrowUp':
                    event.preventDefault();
                    moveActive(-1);
                    return true;
                case 'Home': {
                    event.preventDefault();
                    const idx = visibleOptions.findIndex((o) => !o.disabled);
                    if (idx >= 0) {
                        setActiveIndex(idx);
                    }
                    return true;
                }
                case 'End': {
                    event.preventDefault();
                    for (let i = visibleOptions.length - 1; i >= 0; i -= 1) {
                        if (!visibleOptions[i]?.disabled) {
                            setActiveIndex(i);
                            break;
                        }
                    }
                    return true;
                }
                case 'Enter': {
                    const opt = visibleOptions[activeIndex];
                    if (opt) {
                        event.preventDefault();
                        onSelect(opt);
                    }
                    return true;
                }
                case 'Escape':
                    event.preventDefault();
                    setOpen(false);
                    // Restore focus to the trigger so the next Tab keeps the
                    // user inside the same widget instead of jumping to <body>.
                    if (Platform.OS === 'web') {
                        const trigger = triggerRef.current as unknown as { focus?: () => void } | null;
                        trigger?.focus?.();
                    }
                    return true;
                case 'Tab':
                    setOpen(false);
                    return true;
            }
            return false;
        },
        [moveActive, activeIndex, visibleOptions, onSelect]
    );

    const handleSearchKeyDown = useCallback(
        (event: KeyboardEvent<HTMLInputElement>) => {
            handleListKeyDown(event);
        },
        [handleListKeyDown]
    );

    // Popup-container handler — only attached when there's no search input,
    // so we own type-ahead here. Falls through to the shared list handler
    // for arrow keys / Enter / Escape / Tab.
    const handlePopupKeyDown = useCallback(
        (event: KeyboardEvent<HTMLElement>) => {
            if (handleListKeyDown(event)) {
                return;
            }
            // Single printable character without modifiers → feed the
            // type-ahead buffer. Modifier-combos (Cmd-A, Ctrl-K) are left
            // alone so browser/OS shortcuts keep working.
            if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && event.key !== ' ') {
                event.preventDefault();
                handleTypeAhead(event.key);
            }
        },
        [handleListKeyDown, handleTypeAhead]
    );

    const handleTriggerKeyDown = useCallback(
        (event: KeyboardEvent<HTMLElement>) => {
            switch (event.key) {
                case ' ':
                case 'Enter':
                case 'ArrowDown':
                case 'ArrowUp':
                    event.preventDefault();
                    setOpen(true);
                    return;
            }
            // Type-ahead on the closed trigger: open the popup and jump to
            // the matching option. Mirrors native <select> behaviour where
            // typing a letter while the control has focus changes the
            // highlighted choice without an explicit "open" gesture.
            if (!disabled && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
                event.preventDefault();
                setOpen(true);
                handleTypeAhead(event.key);
            }
        },
        [disabled, handleTypeAhead]
    );

    // Close when clicking outside (web only). The outside check considers
    // BOTH the container (trigger area) and the popup ref because the popup
    // portals out of the container's DOM subtree (position: fixed escapes
    // any overflow:hidden ancestor, but still belongs to the same logical
    // widget).
    const containerRef = useRef<HTMLDivElement | null>(null);
    const triggerRef = useRef<HTMLElement | null>(null);
    const popupRef = useRef<HTMLDivElement | null>(null);
    const listboxRef = useRef<HTMLDivElement | null>(null);
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

    // Auto-focus the listbox when it opens without a search field —
    // otherwise key events have nowhere to land and the user gets a popup
    // they can only operate with the mouse. With a search field, the input's
    // own auto-focus effect already handles this.
    useEffect(() => {
        if (!open || searchable || Platform.OS !== 'web') {
            return;
        }
        const id = requestAnimationFrame(() => {
            const node = listboxRef.current as unknown as { focus?: () => void } | null;
            node?.focus?.();
        });
        return () => cancelAnimationFrame(id);
    }, [open, searchable]);

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
                    'aria-controls': listboxId,
                    'aria-haspopup': 'listbox',
                    tabIndex: disabled ? -1 : 0,
                    ...(id !== undefined ? { id, nativeID: id } : {}),
                    ...(ariaLabel !== undefined ? { 'aria-label': ariaLabel, accessibilityLabel: ariaLabel } : {}),
                    ...(ariaLabelledBy !== undefined
                        ? { 'aria-labelledby': ariaLabelledBy, accessibilityLabelledBy: ariaLabelledBy }
                        : {}),
                    ...(ariaDescribedBy !== undefined
                        ? { 'aria-describedby': ariaDescribedBy, accessibilityDescribedBy: ariaDescribedBy }
                        : {}),
                    ...(ariaInvalid === true ? { 'aria-invalid': true } : {}),
                    ...(ariaRequired === true ? { 'aria-required': true } : {}),
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

            {/* react-native-web drops `name` from its primitives, so form participation needs a real input. */}
            {Platform.OS === 'web' && name !== undefined ? (
                multiple ? (
                    currentValues.map((value) => (
                        <input key={value} type="hidden" name={name} value={value} disabled={disabled} />
                    ))
                ) : (
                    <input type="hidden" name={name} value={current ?? ''} disabled={disabled} />
                )
            ) : null}

            {open ? renderPopup() : null}
        </View>
    );

    function renderPopup(): React.ReactNode {
        const activeDescendant =
            visibleOptions[activeIndex] !== undefined ? getOptionId(listboxId, activeIndex) : undefined;
        const popup = (
            <View
                ref={(node) => {
                    popupRef.current = node as unknown as HTMLDivElement | null;
                }}
                style={popupStyle}
            >
                {searchable ? (
                    <SearchInput
                        value={searchInput}
                        onChange={setSearchInput}
                        onKeyDown={handleSearchKeyDown}
                        placeholder={searchPlaceholder}
                        label={t('select.searchLabel')}
                        dir={dir}
                        listboxId={listboxId}
                        activeDescendant={activeDescendant}
                    />
                ) : null}
                {multiple && currentValues.length > 0 ? (
                    <MultiSelectionHeader count={currentValues.length} onClearAll={clearAll} />
                ) : null}
                <View
                    ref={(node) => {
                        listboxRef.current = node as unknown as HTMLDivElement | null;
                    }}
                    {...({
                        role: 'listbox',
                        id: listboxId,
                        nativeID: listboxId,
                        ...(multiple ? { 'aria-multiselectable': true } : {}),
                        // Without a search field there's no input to capture
                        // keystrokes — make the listbox itself focusable and
                        // own arrow / Enter / Escape / type-ahead. With a
                        // search field these belong to the input above.
                        ...(searchable
                            ? {}
                            : {
                                  tabIndex: -1,
                                  onKeyDown: handlePopupKeyDown,
                                  ...(activeDescendant !== undefined
                                      ? { 'aria-activedescendant': activeDescendant }
                                      : {}),
                              }),
                    } as Record<string, unknown>)}
                >
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
                        listboxId={listboxId}
                        onScroll={onListScroll}
                    />
                </View>
            </View>
        );
        if (Platform.OS === 'web') {
            return <SelectPortal>{popup}</SelectPortal>;
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

// ---------- search input ----------

const getOptionId = (listboxId: string, index: number): string => `${listboxId}-option-${index}`;

type SearchInputProps = {
    value: string;
    onChange: (next: string) => void;
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
    placeholder: string;
    /** Accessible name — the field has no visible label. */
    label: string;
    dir: 'ltr' | 'rtl';
    listboxId: string;
    activeDescendant: string | undefined;
};

const SearchInput = ({
    value,
    onChange,
    onKeyDown,
    placeholder,
    label,
    dir,
    listboxId,
    activeDescendant,
}: SearchInputProps) => {
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
            {Platform.OS === 'web' ? (
                // A DOM input rather than RN's TextInput: react-native-web's
                // TextInput swallows `onKeyDown`, which the list navigation needs.
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={placeholder}
                    dir={dir}
                    aria-label={label}
                    aria-autocomplete="list"
                    aria-controls={listboxId}
                    aria-activedescendant={activeDescendant}
                    autoComplete="off"
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
            ) : (
                <RNTextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder={placeholder}
                    placeholderTextColor={colors.semantic.text.muted}
                    accessibilityLabel={label}
                    autoFocus
                    autoCorrect={false}
                    autoCapitalize="none"
                    returnKeyType="search"
                    style={{
                        paddingHorizontal: px(colors.spacing['2']),
                        paddingVertical: px(colors.spacing['2']) - 2,
                        fontFamily: colors.fontFamily.body,
                        fontSize: px(colors.fontSize.sm),
                        color: colors.semantic.text.default,
                        backgroundColor: colors.semantic.background.elevated,
                        borderWidth: 1,
                        borderColor: colors.semantic.border.default,
                        borderRadius: px(colors.radius.sm),
                        textAlign: dir === 'rtl' ? 'right' : 'left',
                    }}
                />
            )}
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
    const scrollRef = useRef<ScrollView | null>(null);
    const scrollTopRef = useRef(0);
    const viewportHeightRef = useRef(maxHeight);
    // Native-only: measured y of each option inside the scroll content, so
    // group headers (whose height is not `itemHeight`) are accounted for.
    const optionOffsetsRef = useRef(new Map<number, number>());
    // Set when the pointer moved the active option. Hovering a row means it is
    // already on screen, and scrolling it would shift the list under the cursor.
    const activatedByPointerRef = useRef(false);

    // Keep the keyboard-active option inside the viewport.
    useEffect(() => {
        if (activatedByPointerRef.current) {
            activatedByPointerRef.current = false;
            return;
        }
        let top: number;
        if (virtualized) {
            top = activeIndex * itemHeight;
        } else if (Platform.OS === 'web') {
            // react-native-web Views are `position: relative`, so `offsetTop`
            // is the row's offset inside the scroll content.
            const node =
                typeof document === 'undefined' ? null : document.getElementById(getOptionId(listboxId, activeIndex));
            if (!node) {
                return;
            }
            top = node.offsetTop;
        } else {
            top = optionOffsetsRef.current.get(activeIndex) ?? activeIndex * itemHeight;
        }
        const viewportHeight = viewportHeightRef.current;
        const current = scrollTopRef.current;
        let next = current;
        if (top < current) {
            next = top;
        } else if (top + itemHeight > current + viewportHeight) {
            next = top + itemHeight - viewportHeight;
        }
        if (next === current) {
            return;
        }
        scrollTopRef.current = next;
        if (virtualized) {
            // Render the target window right away instead of waiting for the
            // scroll event, so the active row exists as soon as it is active.
            setScrollTop(next);
        }
        const scroller = scrollRef.current as { scrollTo?: (options: { y: number; animated: boolean }) => void } | null;
        scroller?.scrollTo?.({ y: next, animated: false });
    }, [activeIndex, virtualized, itemHeight, listboxId]);

    const totalHeight = options.length * itemHeight;
    const visibleStart = virtualized ? Math.max(0, Math.floor(scrollTop / itemHeight) - VIRTUAL_OVERSCAN) : 0;
    const visibleEnd = virtualized
        ? Math.min(options.length, Math.ceil((scrollTop + maxHeight) / itemHeight) + VIRTUAL_OVERSCAN)
        : options.length;

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        scrollTopRef.current = offsetY;
        if (virtualized) {
            setScrollTop(offsetY);
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
                    id: getOptionId(listboxId, i),
                    nativeID: getOptionId(listboxId, i),
                    'aria-selected': selected,
                    onMouseEnter: () => {
                        if (i !== activeIndex) {
                            activatedByPointerRef.current = true;
                            onActiveChange(i);
                        }
                    },
                    ...(!virtualized && Platform.OS !== 'web'
                        ? {
                              onLayout: (event: LayoutChangeEvent) => {
                                  optionOffsetsRef.current.set(i, event.nativeEvent.layout.y);
                              },
                          }
                        : {}),
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
    // native, so the handler is identical on both.
    return (
        <ScrollView
            ref={scrollRef}
            onLayout={(event) => {
                viewportHeightRef.current = event.nativeEvent.layout.height;
            }}
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
    const { t } = useTranslation();
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
                {t('select.selectedCount', { count: options.length })}
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
    const { t } = useTranslation();
    const clearAllLabel = t('select.clearAll');
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
                {t('select.selectedCount', { count })}
            </RNText>
            <Pressable
                role="button"
                accessibilityRole="button"
                aria-label={clearAllLabel}
                accessibilityLabel={clearAllLabel}
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
                    {clearAllLabel}
                </RNText>
            </Pressable>
        </View>
    );
};
