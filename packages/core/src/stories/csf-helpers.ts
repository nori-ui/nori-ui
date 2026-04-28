// Pure string helpers shared between the runtime CSF loader and the
// Node-only `csf-slugs` helper. Kept dependency-free so the Node helper
// never pulls in `csf-loader.tsx` (which depends on `csf-loader-bundler`,
// which uses `import.meta`).

/**
 * Convert PascalCase → kebab-case using only lowercase→uppercase
 * boundaries so leading acronyms stay intact: `'HStack'` → `'hstack'`,
 * `'AlertDialog'` → `'alert-dialog'`. Matches the docs MDX filename
 * convention (`hstack.mdx`, not `h-stack.mdx`).
 */
export function pascalToKebab(s: string): string {
    return s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Convert PascalCase → "With Gap" for display. Same boundary rule as
 * `pascalToKebab` (only lowercase→uppercase splits).
 */
export function humanise(s: string): string {
    const spaced = s.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
