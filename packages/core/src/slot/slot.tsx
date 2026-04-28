import type { CSSProperties, ReactElement, Ref } from 'react';
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
    const child = Children.only(children) as ReactElement<AnyProps> & { ref?: Ref<unknown> };
    const merged = mergeProps(slotProps, child.props);

    // Merge refs: Slot's forwarded ref + the child's own ref (if any).
    const childRef = (child as unknown as { ref?: Ref<unknown> }).ref;
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
            merged[key] = {
                ...(outerValue as CSSProperties | undefined),
                ...(innerValue as CSSProperties | undefined),
            };
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
