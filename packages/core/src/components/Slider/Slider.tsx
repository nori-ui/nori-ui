'use client';

import {
    type KeyboardEvent,
    type PointerEvent as ReactPointerEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import type { GestureResponderEvent, ViewStyle } from 'react-native';
import { Platform, View } from 'react-native';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';
import { useSliderGesturePublisher } from './slider-gesture-context';

export type SliderOrientation = 'horizontal' | 'vertical';
export type SliderDirection = 'ltr' | 'rtl';

export type SliderProps = {
    /** Controlled value(s). For a single-thumb slider pass `[n]`. */
    value?: ReadonlyArray<number>;
    /** Uncontrolled initial value(s). @defaultValue [0] */
    defaultValue?: ReadonlyArray<number>;
    /** Fires continuously while a thumb moves. */
    onChange?: (next: number[]) => void;
    /** Fires when interaction ends (pointer up, key release). */
    onValueCommit?: (next: number[]) => void;
    /**
     * Fires when a pointer/touch starts driving the slider. Pair with
     * `onInteractionEnd` to toggle a parent ScrollView's `scrollEnabled`
     * — RN's responder system can't preempt UIScrollView's native pan
     * recognizer on iOS, so the canonical fix is for the consumer to
     * disable scroll while the user is actively dragging.
     */
    onInteractionStart?: () => void;
    /** Fires when a pointer/touch releases (pair with `onInteractionStart`). */
    onInteractionEnd?: () => void;
    /** @defaultValue 0 */
    min?: number;
    /** @defaultValue 100 */
    max?: number;
    /** Step size. @defaultValue 1 */
    step?: number;
    /** Multi-thumb spacing — minimum number of `step`s required between adjacent thumbs. @defaultValue 0 */
    minStepsBetweenThumbs?: number;
    /** @defaultValue 'horizontal' */
    orientation?: SliderOrientation;
    /** Reading direction. Affects which end is min/max for horizontal sliders. @defaultValue 'ltr' */
    dir?: SliderDirection;
    /** Reverse the visual + interaction direction (useful for "less is more" sliders). */
    inverted?: boolean;
    /** When true, the slider is non-interactive. */
    disabled?: boolean;
    /** Group-level accessibility label. */
    'aria-label'?: string;
    /** Per-thumb label provider — `(index) => string`. Required for multi-thumb sliders to announce sensibly. */
    ariaLabelForThumb?: (thumbIndex: number) => string;
    /** Fixed track length when orientation="vertical". @defaultValue 200 */
    length?: number;
    className?: string;
    testID?: string;
};

const TRACK_THICKNESS = 6;
const THUMB_SIZE = 18;
const THUMB_HIT_SLOP = 8;

// Clamp + snap a raw value to [min, max] on the step grid.
const snap = (raw: number, min: number, max: number, step: number): number => {
    const clamped = Math.min(max, Math.max(min, raw));
    if (step <= 0) {
        return clamped;
    }
    const stepped = Math.round((clamped - min) / step) * step + min;
    return Math.min(max, Math.max(min, Number.parseFloat(stepped.toFixed(10))));
};

// Replace one entry in a sorted-values array, then re-sort and enforce
// the minStepsBetweenThumbs spacing.
const updateAt = (values: ReadonlyArray<number>, index: number, next: number, gap: number): number[] => {
    const out = values.slice();
    out[index] = next;
    // Enforce gap by clamping against neighbors. We don't re-sort the array
    // because thumb identity matters across drags; instead each thumb is
    // bounded by its neighbors' positions.
    const left = index > 0 ? out[index - 1] : undefined;
    const right = index < out.length - 1 ? out[index + 1] : undefined;
    if (left !== undefined && next < left + gap) {
        out[index] = left + gap;
    }
    if (right !== undefined && next > right - gap) {
        out[index] = right - gap;
    }
    return out;
};

/**
 * Continuous-value slider. Single-thumb, range (two thumbs), or N-thumb
 * for multi-handle pickers. Mirrors Radix's Slider API: `value`/`defaultValue`
 * is always an array, `onChange` fires continuously while dragging,
 * and `onValueCommit` fires when interaction ends.
 *
 * Keyboard nav (per-thumb):
 *   - ArrowRight/ArrowUp → +step (ArrowLeft/ArrowDown → -step). The axis
 *     follows orientation; horizontal sliders honor `dir="rtl"` and
 *     `inverted` to flip arrow meaning.
 *   - PageUp/PageDown → ±10·step (or ±10% of range, whichever is larger).
 *   - Home / End → min / max.
 *
 * Pointer behavior (web): clicking the track moves the nearest thumb to
 * the click; dragging a thumb continuously updates with `pointer-capture`
 * so the cursor doesn't lose tracking when it strays off the thumb. On
 * native, tap-to-position works; long-press dragging is a future
 * enhancement.
 *
 * RTL: when `dir="rtl"` (horizontal only), the visual mapping flips so
 * the higher value sits on the left, matching Radix and shadcn.
 */
export const Slider = ({
    value,
    defaultValue,
    onChange,
    onValueCommit,
    onInteractionStart,
    onInteractionEnd,
    min = 0,
    max = 100,
    step = 1,
    minStepsBetweenThumbs = 0,
    orientation = 'horizontal',
    dir = 'ltr',
    inverted = false,
    disabled = false,
    ariaLabelForThumb,
    length = 200,
    className,
    testID,
    ...rest
}: SliderProps) => {
    const colors = useThemeColors();
    const ariaLabel = rest['aria-label'];
    const isVertical = orientation === 'vertical';
    // `reversed` flips the visual mapping: default vertical sliders have
    // max at the TOP (drag UP to increase, matching audio faders / volume
    // controls / brightness sliders). Horizontal LTR has max at the
    // right; horizontal RTL flips that. The `inverted` prop opts INTO
    // the opposite direction for either axis.
    const reversed = isVertical ? Boolean(inverted) : dir === 'rtl' ? !inverted : Boolean(inverted);
    const gap = step * minStepsBetweenThumbs;

    const initial = (defaultValue ?? value ?? [min]).map((v) => snap(v, min, max, step));
    const [inner, setInner] = useState<number[]>(initial);
    const isControlled = value !== undefined;
    const current = isControlled ? value.map((v) => snap(v, min, max, step)) : inner;

    const trackRef = useRef<View | null>(null);
    const trackRectRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

    // Measure the track on layout (RN onLayout), and on web also on
    // window resize, since onLayout doesn't fire for window-relative shifts.
    // On native we use `measureInWindow` to get window-relative coords that
    // line up with `event.nativeEvent.pageX/pageY` from the responder.
    const measure = useCallback(() => {
        const node = trackRef.current;
        if (!node) {
            return;
        }
        if (Platform.OS === 'web') {
            const webNode = node as unknown as HTMLElement;
            if (typeof window === 'undefined' || typeof webNode.getBoundingClientRect !== 'function') {
                return;
            }
            const rect = webNode.getBoundingClientRect();
            trackRectRef.current = { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
            return;
        }
        if (typeof node.measureInWindow === 'function') {
            node.measureInWindow((x, y, width, height) => {
                trackRectRef.current = { x, y, width, height };
            });
        }
    }, []);

    useEffect(() => {
        if (Platform.OS !== 'web') {
            return;
        }
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [measure]);

    const setValues = useCallback(
        (next: number[]) => {
            if (!isControlled) {
                setInner(next);
            }
            onChange?.(next);
        },
        [isControlled, onChange]
    );

    const commitValues = useCallback(
        (next: number[]) => {
            onValueCommit?.(next);
        },
        [onValueCommit]
    );

    // Convert pointer position → value. Returns the value the cursor maps to,
    // honoring orientation, RTL/inverted, and snapping to step.
    const valueFromClient = useCallback(
        (clientX: number, clientY: number): number => {
            const rect = trackRectRef.current;
            if (!rect) {
                return min;
            }
            const len = isVertical ? rect.height : rect.width;
            if (len <= 0) {
                return min;
            }
            const offset = isVertical ? clientY - rect.y : clientX - rect.x;
            let ratio = offset / len;
            ratio = Math.min(1, Math.max(0, ratio));
            // For vertical, the visual top is max (higher = up), so invert.
            if (isVertical) {
                ratio = 1 - ratio;
            }
            if (reversed) {
                ratio = 1 - ratio;
            }
            const raw = min + ratio * (max - min);
            return snap(raw, min, max, step);
        },
        [isVertical, reversed, min, max, step]
    );

    // Find the index of the thumb closest to a given value.
    const closestThumbIndex = useCallback(
        (target: number): number => {
            let best = 0;
            let bestDelta = Number.POSITIVE_INFINITY;
            for (let i = 0; i < current.length; i += 1) {
                const cv = current[i];
                if (cv === undefined) {
                    continue;
                }
                const delta = Math.abs(cv - target);
                if (delta < bestDelta) {
                    best = i;
                    bestDelta = delta;
                }
            }
            return best;
        },
        [current]
    );

    const draggingRef = useRef<{ index: number; pointerId: number } | null>(null);
    // Auto-publishes drag state to a `<SliderGestureProvider>` ancestor
    // (no-op if none is mounted). Containers that need to disable scroll
    // during a drag read the same context via `useSliderInteractionActive`.
    const gesturePublisher = useSliderGesturePublisher();

    const onTrackPointerDown = useCallback(
        (event: ReactPointerEvent<HTMLElement>) => {
            if (disabled) {
                return;
            }
            measure();
            const targetValue = valueFromClient(event.clientX, event.clientY);
            const idx = closestThumbIndex(targetValue);
            const next = updateAt(current, idx, targetValue, gap);
            setValues(next);
            draggingRef.current = { index: idx, pointerId: event.pointerId };
            event.currentTarget.setPointerCapture?.(event.pointerId);
            gesturePublisher.begin();
            onInteractionStart?.();
        },
        [
            disabled,
            measure,
            valueFromClient,
            closestThumbIndex,
            current,
            gap,
            setValues,
            gesturePublisher,
            onInteractionStart,
        ]
    );

    const onTrackPointerMove = useCallback(
        (event: ReactPointerEvent<HTMLElement>) => {
            const drag = draggingRef.current;
            if (!drag || drag.pointerId !== event.pointerId) {
                return;
            }
            const targetValue = valueFromClient(event.clientX, event.clientY);
            const next = updateAt(current, drag.index, targetValue, gap);
            setValues(next);
        },
        [valueFromClient, current, gap, setValues]
    );

    const onTrackPointerUp = useCallback(
        (event: ReactPointerEvent<HTMLElement>) => {
            const drag = draggingRef.current;
            if (!drag || drag.pointerId !== event.pointerId) {
                return;
            }
            draggingRef.current = null;
            commitValues(current);
            gesturePublisher.end();
            onInteractionEnd?.();
        },
        [commitValues, current, gesturePublisher, onInteractionEnd]
    );

    const handleThumbKeyDown = useCallback(
        (index: number) => (event: KeyboardEvent<HTMLElement>) => {
            if (disabled) {
                return;
            }
            const cv = current[index];
            if (cv === undefined) {
                return;
            }
            const range = max - min;
            const big = Math.max(step * 10, range / 10);
            const arrowSign = (key: 'inc' | 'dec') => {
                // Arrow ↑/→ is "increase" in default direction; flip for RTL/inverted.
                const base = key === 'inc' ? 1 : -1;
                return reversed ? -base : base;
            };
            let nextValue = cv;
            switch (event.key) {
                case 'ArrowRight':
                case 'ArrowUp':
                    nextValue = cv + step * arrowSign('inc');
                    break;
                case 'ArrowLeft':
                case 'ArrowDown':
                    nextValue = cv + step * arrowSign('dec');
                    break;
                case 'PageUp':
                    nextValue = cv + big * arrowSign('inc');
                    break;
                case 'PageDown':
                    nextValue = cv + big * arrowSign('dec');
                    break;
                case 'Home':
                    nextValue = min;
                    break;
                case 'End':
                    nextValue = max;
                    break;
                default:
                    return;
            }
            event.preventDefault();
            const snapped = snap(nextValue, min, max, step);
            const next = updateAt(current, index, snapped, gap);
            setValues(next);
            commitValues(next);
        },
        [disabled, current, max, min, step, reversed, gap, setValues, commitValues]
    );

    // Visual layout. The thumb sits on top of the track at its value's
    // position; the range fills from the lowest thumb to the highest.
    const pctSig = (n: number) => `${Math.round(n * 10000) / 10000}%` as unknown as number;
    const thumbPositionStyle = (val: number): ViewStyle => {
        const ratio = (val - min) / (max - min || 1);
        const offset = pctSig((reversed ? 1 - ratio : ratio) * 100);
        if (isVertical) {
            // Vertical: top=max, bottom=min by default (reverse visual mapping).
            const verticalOffset = pctSig((reversed ? ratio : 1 - ratio) * 100);
            return {
                position: 'absolute',
                top: verticalOffset,
                left: pctSig(50),
                marginLeft: -THUMB_SIZE / 2,
                marginTop: -THUMB_SIZE / 2,
            };
        }
        return {
            position: 'absolute',
            left: offset,
            top: pctSig(50),
            marginLeft: -THUMB_SIZE / 2,
            marginTop: -THUMB_SIZE / 2,
        };
    };

    const sortedValues = useMemo(() => current.slice().sort((a, b) => a - b), [current]);
    // Fill behavior:
    //   - Single thumb: fill from min → value (matches Radix / shadcn).
    //     Without this, a single-thumb slider has no visible fill at all
    //     because the start and end of the range are the same value.
    //   - Multi thumb: fill from lowest thumb → highest thumb (range region).
    const isSingle = sortedValues.length <= 1;
    const fillStart = isSingle ? min : (sortedValues[0] ?? min);
    const fillEnd = isSingle ? (sortedValues[0] ?? min) : (sortedValues[sortedValues.length - 1] ?? min);
    const startRatio = (fillStart - min) / (max - min || 1);
    const endRatio = (fillEnd - min) / (max - min || 1);

    // Casts: RN-Web accepts percentage strings for inset properties, but
    // RN's TS surface (DimensionValue) is narrower. Cast at the boundary.
    // Round to 4 decimals so floating-point noise (`19.999999%`) doesn't
    // bleed into rendered styles.
    const pct = (n: number) => `${Math.round(n * 10000) / 10000}%` as unknown as number;
    const rangeStyle: ViewStyle = isVertical
        ? {
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: pct((reversed ? 1 - endRatio : startRatio) * 100),
              top: pct((reversed ? startRatio : 1 - endRatio) * 100),
              backgroundColor: disabled ? colors.color.neutral['400'] : colors.semantic.interactive.primary,
          }
        : {
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: pct((reversed ? 1 - endRatio : startRatio) * 100),
              right: pct((reversed ? startRatio : 1 - endRatio) * 100),
              backgroundColor: disabled ? colors.color.neutral['400'] : colors.semantic.interactive.primary,
          };

    const trackStyle: ViewStyle = isVertical
        ? {
              width: TRACK_THICKNESS,
              height: length,
              backgroundColor: colors.semantic.background.subtle,
              borderRadius: TRACK_THICKNESS / 2,
              position: 'relative',
              // No overflow: hidden here — the thumb is a child and we don't
              // want it clipped at the track's edge. The fill below sits in
              // its own absolutely-positioned slot inside the track and
              // already paints within the track's rounded corners thanks to
              // matching borderRadius, so we don't need to clip.
          }
        : {
              height: TRACK_THICKNESS,
              width: '100%',
              backgroundColor: colors.semantic.background.subtle,
              borderRadius: TRACK_THICKNESS / 2,
              position: 'relative',
              // No overflow: hidden here — the thumb is a child and we don't
              // want it clipped at the track's edge. The fill below sits in
              // its own absolutely-positioned slot inside the track and
              // already paints within the track's rounded corners thanks to
              // matching borderRadius, so we don't need to clip.
          };

    const containerStyle: ViewStyle = isVertical
        ? {
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: THUMB_HIT_SLOP,
              paddingHorizontal: THUMB_SIZE,
              opacity: disabled ? 0.5 : 1,
          }
        : {
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: THUMB_HIT_SLOP,
              paddingHorizontal: THUMB_SIZE / 2,
              opacity: disabled ? 0.5 : 1,
          };

    // Native gesture handlers — claim the responder so a parent ScrollView
    // can't steal the drag, then drive the same value-from-coords logic
    // using `pageX`/`pageY` (window-relative, matches `measureInWindow`).
    const onTrackResponderGrant = useCallback(
        (event: GestureResponderEvent) => {
            if (disabled) {
                return;
            }
            // Re-measure on grant to capture any layout shift that happened
            // between mount and the first touch (e.g. inside an animated
            // ScrollView). Doing it here is cheap and guarantees fresh
            // coords for the upcoming move sequence.
            measure();
            const { pageX, pageY } = event.nativeEvent;
            const targetValue = valueFromClient(pageX, pageY);
            const idx = closestThumbIndex(targetValue);
            const next = updateAt(current, idx, targetValue, gap);
            setValues(next);
            draggingRef.current = { index: idx, pointerId: 0 };
            gesturePublisher.begin();
            onInteractionStart?.();
        },
        [
            disabled,
            measure,
            valueFromClient,
            closestThumbIndex,
            current,
            gap,
            setValues,
            gesturePublisher,
            onInteractionStart,
        ]
    );
    const onTrackResponderMove = useCallback(
        (event: GestureResponderEvent) => {
            if (!draggingRef.current) {
                return;
            }
            const { pageX, pageY } = event.nativeEvent;
            const targetValue = valueFromClient(pageX, pageY);
            const next = updateAt(current, draggingRef.current.index, targetValue, gap);
            setValues(next);
        },
        [valueFromClient, current, gap, setValues]
    );
    const onTrackResponderRelease = useCallback(() => {
        if (!draggingRef.current) {
            return;
        }
        draggingRef.current = null;
        commitValues(current);
        gesturePublisher.end();
        onInteractionEnd?.();
    }, [commitValues, current, gesturePublisher, onInteractionEnd]);

    // RN's View doesn't model pointer events in its TS surface; rn-web
    // forwards them. Cast at the spread boundary. Native uses the
    // GestureResponder system so a vertical slider inside a ScrollView
    // still wins the touch — `onMoveShouldSetResponderCapture` claims
    // the gesture before the ScrollView can.
    const trackPointerProps: Record<string, unknown> =
        Platform.OS === 'web'
            ? {
                  onPointerDown: onTrackPointerDown,
                  onPointerMove: onTrackPointerMove,
                  onPointerUp: onTrackPointerUp,
                  onPointerCancel: onTrackPointerUp,
              }
            : {
                  // Capture variants run BEFORE non-capture handlers and
                  // walk root → leaf, so they win the gesture against an
                  // ancestor ScrollView whose own `onStartShould` would
                  // otherwise claim the touch first. Without these, a
                  // vertical slider inside a vertical ScrollView lets the
                  // ScrollView swallow the drag.
                  onStartShouldSetResponderCapture: () => !disabled,
                  onMoveShouldSetResponderCapture: () => !disabled,
                  onStartShouldSetResponder: () => !disabled,
                  onMoveShouldSetResponder: () => !disabled,
                  onResponderGrant: onTrackResponderGrant,
                  onResponderMove: onTrackResponderMove,
                  onResponderRelease: onTrackResponderRelease,
                  onResponderTerminate: onTrackResponderRelease,
                  onResponderTerminationRequest: () => false,
              };

    return (
        <View
            {...(testID !== undefined ? { testID } : {})}
            role="group"
            accessibilityRole="adjustable"
            {...(ariaLabel !== undefined ? { 'aria-label': ariaLabel, accessibilityLabel: ariaLabel } : {})}
            {...(disabled ? { 'aria-disabled': true } : {})}
            className={cn(
                isVertical ? 'flex-col items-center' : 'flex-row items-center',
                disabled ? 'opacity-50' : undefined,
                className
            )}
            style={containerStyle}
        >
            <View
                ref={trackRef}
                onLayout={measure}
                {...trackPointerProps}
                className={cn('relative bg-neutral-200 rounded-full')}
                style={trackStyle}
            >
                {/* Inner clipper holds the range fill so its left/right
                 * edges round naturally against the track's borderRadius.
                 * The thumbs live OUTSIDE this clipper as direct children
                 * of the track, so they aren't truncated to track height. */}
                <View
                    pointerEvents="none"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderRadius: TRACK_THICKNESS / 2,
                        overflow: 'hidden',
                    }}
                >
                    <View style={rangeStyle} />
                </View>
                {current.map((val, index) => {
                    const ratio = (val - min) / (max - min || 1);
                    const thumbProps: Record<string, unknown> = {
                        role: 'slider',
                        accessibilityRole: 'adjustable',
                        'aria-valuemin': min,
                        'aria-valuemax': max,
                        'aria-valuenow': val,
                        'aria-orientation': orientation,
                        'aria-label': ariaLabelForThumb?.(index) ?? ariaLabel,
                        tabIndex: disabled ? -1 : 0,
                        onKeyDown: handleThumbKeyDown(index),
                        'data-thumb-index': index,
                        'data-value': val,
                        'data-ratio': ratio,
                    };
                    return (
                        <View
                            // biome-ignore lint/suspicious/noArrayIndexKey: thumb identity IS its index — values preserve order across renders.
                            key={`thumb-${index}`}
                            {...thumbProps}
                            style={[
                                thumbPositionStyle(val),
                                {
                                    width: THUMB_SIZE,
                                    height: THUMB_SIZE,
                                    borderRadius: THUMB_SIZE / 2,
                                    backgroundColor: colors.semantic.background.elevated,
                                    borderWidth: 2,
                                    borderColor: disabled
                                        ? colors.color.neutral['400']
                                        : colors.semantic.interactive.primary,
                                    ...(Platform.OS === 'web'
                                        ? ({ boxShadow: '0 1px 2px rgba(0,0,0,0.1)' } as ViewStyle)
                                        : {}),
                                },
                            ]}
                        />
                    );
                })}
            </View>
        </View>
    );
};
