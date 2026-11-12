import type { ReactElement, Ref } from 'react';
import { Children, cloneElement, forwardRef, isValidElement } from 'react';
import { composeRefs } from './compose-refs';

type AnyProps = Record<string, unknown>;

export type SlotProps = {
    children?: React.ReactNode;
} & AnyProps;

export const Slot = forwardRef<unknown, SlotProps>(function Slot(props, forwardedRef) {
    const { children, ...slotProps } = props;

    if (!isValidElement(children)) {
        return null;
    }

    // Assert that children is a single React element with props — we've narrowed above.
    const child = Children.only(children) as ReactElement<AnyProps>;
    const merged = mergeProps(slotProps, child.props);

    // Merge refs: Slot's forwarded ref + the child's own ref (if any). React 19
    // exposes the ref as a regular prop; reading `element.ref` logs a
    // deprecation warning.
    const childRef = child.props.ref as Ref<unknown> | undefined;
    if (forwardedRef || childRef) {
        (merged as AnyProps).ref = composeRefs(forwardedRef, childRef);
    }

    return cloneElement(child, merged);
});
Slot.displayName = 'Slot';

function mergeProps(outer: AnyProps, inner: AnyProps): AnyProps {
    // Inner (child) wins for everything except: className (concatenated), style (merged), and
    // event handlers (composed — outer runs first, then inner).
    const merged: AnyProps = { ...outer };

    for (const key of Object.keys(inner)) {
        const outerValue = outer[key];
        const innerValue = inner[key];

        if (key === 'className' || key === 'class') {
            merged[key] = joinClass(outerValue, innerValue);
            continue;
        }

        if (key === 'style') {
            merged[key] = mergeStyle(outerValue, innerValue);
            continue;
        }

        if (isEventHandler(key, outerValue, innerValue)) {
            merged[key] = composeHandlers(outerValue as Fn, innerValue as Fn);
            continue;
        }

        merged[key] = innerValue;
    }

    return merged;
}

type PressableState = Record<string, unknown>;

/**
 * Child style wins over Slot style. Plain objects are spread into one object
 * (DOM elements only accept an object); arrays, registered style ids, and
 * Pressable's `style={(state) => …}` functions are preserved by composing
 * them into a style array instead of being spread into a broken object.
 */
function mergeStyle(outer: unknown, inner: unknown): unknown {
    if (outer === undefined || outer === null) {
        return inner;
    }
    if (inner === undefined || inner === null) {
        return outer;
    }
    if (typeof outer === 'function' || typeof inner === 'function') {
        const resolve = (value: unknown, state: PressableState) =>
            typeof value === 'function' ? (value as (state: PressableState) => unknown)(state) : value;
        return (state: PressableState) => [resolve(outer, state), resolve(inner, state)];
    }
    if (isPlainObject(outer) && isPlainObject(inner)) {
        return { ...outer, ...inner };
    }
    return [outer, inner];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function joinClass(outer: unknown, inner: unknown): string | undefined {
    const a = typeof outer === 'string' ? outer : '';
    const b = typeof inner === 'string' ? inner : '';
    const joined = [a, b].filter(Boolean).join(' ');
    return joined.length > 0 ? joined : undefined;
}

type Fn = (...args: unknown[]) => unknown;

function isEventHandler(key: string, outer: unknown, inner: unknown): boolean {
    if (!key.startsWith('on') || key.length < 3) {
        return false;
    }
    if (key[2] !== key[2]?.toUpperCase()) {
        return false;
    }
    return typeof outer === 'function' && typeof inner === 'function';
}

function composeHandlers(outer: Fn, inner: Fn): Fn {
    return (...args: unknown[]) => {
        outer(...args);
        inner(...args);
    };
}
