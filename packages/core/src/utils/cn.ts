// cn — class-name merger. clsx-compatible shape.
//
// Intentionally does NOT deduplicate Tailwind conflicts (e.g. "text-sm text-lg").
// That's `tailwind-merge`'s job; we defer adding it until a component actually
// needs it, to keep the core tree-shakable and the runtime zero-dep.

export type ClassInput =
    | string
    | number
    | boolean
    | null
    | undefined
    | ClassInput[]
    | Record<string, boolean | number | null | undefined>;

export function cn(...inputs: ClassInput[]): string {
    const out: string[] = [];
    for (const input of inputs) append(out, input);
    return out.join(' ');
}

function append(out: string[], input: ClassInput): void {
    if (!input) return;
    if (typeof input === 'string') {
        if (input.length > 0) out.push(input);
        return;
    }
    if (typeof input === 'number') return; // numbers are never class names
    if (Array.isArray(input)) {
        for (const inner of input) append(out, inner);
        return;
    }
    if (typeof input === 'object') {
        for (const key of Object.keys(input)) {
            if (input[key]) out.push(key);
        }
    }
}
