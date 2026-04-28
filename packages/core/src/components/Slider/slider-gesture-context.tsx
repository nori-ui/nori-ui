'use client';

// Cross-tree gesture coordination for Slider. iOS UIScrollView's native
// pan recognizer can't be preempted from JS-only responder capture, so
// the canonical workaround is for the wrapping ScrollView to set
// `scrollEnabled={false}` while a slider is actively being dragged. This
// context lets the Slider broadcast "I'm dragging" up the tree without
// the consumer having to wire `onInteractionStart`/`onInteractionEnd`
// individually for every Slider instance — drop a `<SliderGestureProvider>`
// above your scroll container and read `useSliderInteractionActive()`
// inside it to drive `scrollEnabled`.

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

type Subscriber = (active: boolean) => void;
type Bus = {
    /** Mark the start of a drag; returns a release fn that decrements the active count. */
    begin: () => () => void;
    /** Subscribe to active-state transitions. Returns an unsubscribe fn. */
    subscribe: (s: Subscriber) => () => void;
};

const Ctx = createContext<Bus | null>(null);

export function SliderGestureProvider({ children }: { children: ReactNode }) {
    // We track concurrent drags (theoretically multiple sliders, e.g. a
    // range with two thumbs) via a ref so begin/release are O(1) and
    // don't trigger re-renders on the provider itself.
    const activeCount = useRef(0);
    const subs = useRef(new Set<Subscriber>());

    const broadcast = useCallback(() => {
        const isActive = activeCount.current > 0;
        for (const s of subs.current) {
            s(isActive);
        }
    }, []);

    const bus = useMemo<Bus>(
        () => ({
            begin: () => {
                activeCount.current += 1;
                broadcast();
                let released = false;
                return () => {
                    if (released) {
                        return;
                    }
                    released = true;
                    activeCount.current = Math.max(0, activeCount.current - 1);
                    broadcast();
                };
            },
            subscribe: (s) => {
                subs.current.add(s);
                return () => {
                    subs.current.delete(s);
                };
            },
        }),
        [broadcast]
    );

    return <Ctx.Provider value={bus}>{children}</Ctx.Provider>;
}

/**
 * Read by Slider internally — publishes drag start/end to the provider.
 * Returns { begin, end } stable across renders. No-op if no provider.
 */
export function useSliderGesturePublisher(): { begin: () => void; end: () => void } {
    const bus = useContext(Ctx);
    const releaseRef = useRef<null | (() => void)>(null);
    return useMemo(
        () => ({
            begin: () => {
                if (!bus) {
                    return;
                }
                if (releaseRef.current) {
                    return;
                }
                releaseRef.current = bus.begin();
            },
            end: () => {
                if (!bus) {
                    return;
                }
                releaseRef.current?.();
                releaseRef.current = null;
            },
        }),
        [bus]
    );
}

/**
 * Read by a wrapping container (e.g. a ScrollView) to know whether any
 * descendant Slider is actively being dragged. Returns `false` when no
 * provider is mounted.
 */
export function useSliderInteractionActive(): boolean {
    const bus = useContext(Ctx);
    const [active, setActive] = useState(false);
    useEffect(() => {
        if (!bus) {
            return;
        }
        const unsubscribe = bus.subscribe(setActive);
        return unsubscribe;
    }, [bus]);
    return active;
}
