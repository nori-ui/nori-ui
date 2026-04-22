// tokens/src/formats/tailwind-preset.mjs
// Custom Style Dictionary format: emits a Tailwind preset JS object consumable by
// tailwind.config.ts / NativeWind. Uses the token tree's structure directly — no magic.

/**
 * @param {{ dictionary: import('style-dictionary').Dictionary; options: { mode: 'light' | 'dark' } }} args
 * @returns {string}
 */
function formatTailwindPreset({ dictionary, options }) {
    const tree = buildTree(dictionary.allTokens);

    const extend = {
        colors: flattenNamespace(tree.color ?? {}, tree.semantic ?? {}),
        spacing: flattenLeaves(tree.spacing ?? {}),
        borderRadius: flattenLeaves(tree.radius ?? {}),
        fontSize: flattenLeaves(tree.fontSize ?? {}),
        fontWeight: flattenLeaves(tree.fontWeight ?? {}),
        lineHeight: flattenLeaves(tree.lineHeight ?? {}),
        boxShadow: flattenLeaves(tree.shadow ?? {}),
    };

    return `module.exports = ${stableStringify({ mode: options.mode, theme: { extend } })};\n`;
}

function buildTree(tokens) {
    const root = {};
    for (const token of tokens) {
        let node = root;
        for (let i = 0; i < token.path.length - 1; i++) {
            const key = token.path[i];
            node[key] = node[key] ?? {};
            node = node[key];
        }
        node[token.path[token.path.length - 1]] = token.value;
    }
    return root;
}

function flattenLeaves(obj) {
    const out = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string' || typeof value === 'number') {
            out[key] = String(value);
        }
    }
    return out;
}

function flattenNamespace(color, semantic) {
    const out = {};
    for (const [group, values] of Object.entries(color)) {
        if (typeof values === 'string') {
            out[group] = values;
        } else {
            out[group] = flattenLeaves(values);
        }
    }
    // Semantic aliases live under a dedicated key so consumers write `text-semantic-text-default`.
    if (Object.keys(semantic).length > 0) {
        out.semantic = {};
        for (const [group, values] of Object.entries(semantic)) {
            out.semantic[group] = flattenLeaves(values);
        }
    }
    return out;
}

// Deterministic stringifier — sorted keys — so output diffs stay minimal.
function stableStringify(value, indent = 4) {
    return JSON.stringify(
        value,
        (_key, v) => {
            if (v && typeof v === 'object' && !Array.isArray(v)) {
                const sorted = {};
                for (const k of Object.keys(v).sort()) {
                    sorted[k] = v[k];
                }
                return sorted;
            }
            return v;
        },
        indent
    );
}

export default {
    name: 'unbogify/tailwind-preset',
    format: formatTailwindPreset,
};
