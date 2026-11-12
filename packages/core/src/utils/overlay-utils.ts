'use client';

import {
    Children,
    isValidElement,
    type ReactElement,
    type ReactNode,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

type OverlayOpenStateInput = {
    open?: boolean | undefined;
    defaultOpen?: boolean | undefined;
    onOpenChange?: ((open: boolean) => void) | undefined;
};

/**
 * Controlled / uncontrolled open state for overlay roots.
 *
 * `setOpen` keeps one identity for the lifetime of the component, even when
 * the consumer passes an inline `onOpenChange`. Effects that depend on it
 * (focus trap, scroll lock) therefore run on open/close only, not on every
 * parent render — re-running them would pull focus out of a form field while
 * the user types.
 */
export function useOverlayOpenState({
    open,
    defaultOpen = false,
    onOpenChange,
}: OverlayOpenStateInput): [boolean, (next: boolean) => void] {
    const [inner, setInner] = useState<boolean>(defaultOpen);
    const isControlled = open !== undefined;

    const isControlledRef = useRef(isControlled);
    isControlledRef.current = isControlled;
    const onOpenChangeRef = useRef(onOpenChange);
    onOpenChangeRef.current = onOpenChange;

    const setOpen = useCallback((next: boolean) => {
        if (!isControlledRef.current) {
            setInner(next);
        }
        onOpenChangeRef.current?.(next);
    }, []);

    return [isControlled ? open : inner, setOpen];
}

type OverlayLabels = {
    hasTitle: boolean;
    hasDescription: boolean;
    /** Call from the Title's effect; returns the matching cleanup. */
    registerTitle: () => () => void;
    /** Call from the Description's effect; returns the matching cleanup. */
    registerDescription: () => () => void;
};

/**
 * Tracks whether a Title / Description is mounted, so the surface only emits
 * `aria-labelledby` / `aria-describedby` for ids that exist in the tree.
 */
export function useOverlayLabels(): OverlayLabels {
    const [titleCount, setTitleCount] = useState(0);
    const [descriptionCount, setDescriptionCount] = useState(0);

    const registerTitle = useCallback(() => {
        setTitleCount((count) => count + 1);
        return () => setTitleCount((count) => count - 1);
    }, []);
    const registerDescription = useCallback(() => {
        setDescriptionCount((count) => count + 1);
        return () => setDescriptionCount((count) => count - 1);
    }, []);

    return {
        hasTitle: titleCount > 0,
        hasDescription: descriptionCount > 0,
        registerTitle,
        registerDescription,
    };
}

/** Registers a mounted Title / Description with `useOverlayLabels`. */
export function useRegisterOverlayLabel(register: () => () => void): void {
    useEffect(() => register(), [register]);
}

type SlotChild = ReactElement<Record<string, unknown>>;

const isDomElement = (child: SlotChild): boolean => typeof child.type === 'string';

/**
 * Test id for a Slot child. React Native components (including
 * react-native-web, which drops unknown `data-*` props) read `testID`; a plain
 * DOM element only understands `data-testid`.
 */
export function slotTestIdProps(child: SlotChild, testID: string | undefined): Record<string, string> {
    if (testID === undefined) {
        return {};
    }
    return isDomElement(child) ? { 'data-testid': testID } : { testID };
}

/**
 * Activation handlers for a Slot child. Pass only the library's own handler:
 * Slot already chains the child's handler of the same name, so wrapping it
 * here as well would call it twice.
 *
 * RN Pressables (and the library's Button) speak `onPress`, DOM elements
 * `onClick`. A DOM element gets `onClick` only, since React warns about an
 * unknown `onPress` there.
 */
export function slotPressProps(
    child: SlotChild,
    handler: (event?: unknown) => void
): Record<string, (event?: unknown) => void> {
    return isDomElement(child) ? { onClick: handler } : { onClick: handler, onPress: handler };
}

/**
 * True when the node tree renders visible text. Used to decide whether a
 * fallback accessible name is needed: a "Cancel" button must be announced as
 * "Cancel", not as the generic fallback label.
 */
export function hasTextContent(node: ReactNode): boolean {
    let found = false;
    Children.forEach(node, (child) => {
        if (found) {
            return;
        }
        if (typeof child === 'string') {
            found = child.trim().length > 0;
            return;
        }
        if (typeof child === 'number') {
            found = true;
            return;
        }
        if (isValidElement<{ children?: ReactNode }>(child)) {
            found = hasTextContent(child.props.children);
        }
    });
    return found;
}

/**
 * `data-*` attributes for an RN primitive. react-native-web only forwards
 * them through `dataSet`; the literal attributes cover renderers that pass
 * props straight to the DOM.
 */
export function dataAttributes(values: Record<string, string>): Record<string, unknown> {
    const attributes: Record<string, unknown> = { dataSet: values };
    for (const [key, value] of Object.entries(values)) {
        attributes[`data-${key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}`] = value;
    }
    return attributes;
}

export type AnchorRect = { top: number; left: number; width: number; height: number };

type MeasurableNode = {
    getBoundingClientRect?: () => { top: number; left: number; width: number; height: number };
    measureInWindow?: (callback: (x: number, y: number, width: number, height: number) => void) => void;
};

/**
 * Window-relative rect of a trigger element. DOM nodes and New Architecture
 * host instances answer synchronously via `getBoundingClientRect`; older
 * native host instances only offer the asynchronous `measureInWindow`.
 */
export function measureAnchorRect(node: unknown, onRect: (rect: AnchorRect) => void): void {
    const target = node as MeasurableNode | null;
    if (!target) {
        return;
    }
    if (typeof target.getBoundingClientRect === 'function') {
        const rect = target.getBoundingClientRect();
        onRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
        return;
    }
    if (typeof target.measureInWindow === 'function') {
        target.measureInWindow((x, y, width, height) => {
            onRect({ top: y, left: x, width, height });
        });
    }
}
