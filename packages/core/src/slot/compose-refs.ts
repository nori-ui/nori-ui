// composeRefs — merges multiple React refs (callback or object) into a single callback.
// Derived from Radix UI's approach; reimplemented here so we don't take a Radix dependency.

import type { MutableRefObject, Ref, RefCallback } from 'react';

type PossibleRef<T> = Ref<T> | undefined;

export function composeRefs<T>(...refs: Array<PossibleRef<T>>): RefCallback<T> {
    return (node: T | null) => {
        for (const ref of refs) {
            if (ref == null) {
                continue;
            }
            if (typeof ref === 'function') {
                ref(node);
            } else {
                // React's MutableRefObject typing — we assign .current directly.
                (ref as MutableRefObject<T | null>).current = node;
            }
        }
    };
}
