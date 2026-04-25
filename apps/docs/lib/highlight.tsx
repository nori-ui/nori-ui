import type { CSSProperties } from 'react';
import { type BundledLanguage, getSingletonHighlighter } from 'shiki';

// Match fumadocs's MDX code-block defaults so our custom code blocks
// (Install, Preview) look identical to triple-backtick blocks in MDX.
const THEMES = { light: 'github-light', dark: 'github-dark' } as const;

const LANGS_INITIAL: readonly BundledLanguage[] = ['tsx', 'ts', 'jsx', 'js', 'bash', 'shellscript'];

const highlighterPromise = getSingletonHighlighter({
    themes: Object.values(THEMES),
    langs: [...LANGS_INITIAL],
});

// Token styles are CSS custom properties (`--shiki-light`, `--shiki-dark`).
// React's `CSSProperties` type from csstype doesn't model `--*` keys, so we
// keep the storage shape as a plain string map and cast at the render edge.
export type StyleMap = Record<string, string>;
export type Token = { content: string; style: StyleMap };
export type Highlighted = { tokens: Token[][]; rootStyle: StyleMap };

const parseStyleString = (s: string | undefined): StyleMap => {
    const obj: StyleMap = {};
    if (!s) return obj;
    for (const decl of s.split(';')) {
        const i = decl.indexOf(':');
        if (i === -1) continue;
        const k = decl.slice(0, i).trim();
        const v = decl.slice(i + 1).trim();
        if (k && v) obj[k] = v;
    }
    return obj;
};

/**
 * Highlight `code` with shiki and return a structured token array suitable
 * for direct React rendering. Uses the same dual-theme setup as fumadocs's
 * MDX code blocks so output looks identical to triple-backtick code in MDX.
 */
export async function highlightTokens(code: string, lang: BundledLanguage): Promise<Highlighted> {
    const h = await highlighterPromise;
    const result = h.codeToTokens(code, {
        lang,
        themes: THEMES,
        defaultColor: false,
    });
    return {
        // Per-token `htmlStyle` is already an object (CSS variables); only
        // the `rootStyle` is a string in shiki 1.x and needs parsing.
        tokens: result.tokens.map((line) =>
            line.map((tok) => ({
                content: tok.content,
                style: (tok.htmlStyle ?? {}) as StyleMap,
            }))
        ),
        rootStyle: parseStyleString(result.rootStyle),
    };
}

/**
 * Render pre-highlighted tokens as React JSX. Output mirrors shiki's
 * `codeToHtml` HTML structure, so fumadocs's CodeBlock copy button
 * (which reads `pre.textContent`) gets the original source verbatim.
 */
export function HighlightedCode({ tokens, rootStyle, className }: Highlighted & { className?: string }) {
    return (
        <pre className={`shiki shiki-themes ${className ?? ''}`} style={rootStyle as CSSProperties}>
            <code>
                {tokens.map((line, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: shiki line index is stable
                    <span key={i} className="line">
                        {line.map((tok, j) => (
                            // biome-ignore lint/suspicious/noArrayIndexKey: shiki token index is stable
                            <span key={`${i}-${j}`} style={tok.style as CSSProperties}>
                                {tok.content}
                            </span>
                        ))}
                        {i < tokens.length - 1 ? '\n' : null}
                    </span>
                ))}
            </code>
        </pre>
    );
}
