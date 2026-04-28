// tokens/src/formats/theme-types.mjs
// Custom Style Dictionary format: emits TypeScript with a typed `theme` object
// + `Theme` interface. Every token path is preserved as a literal key so consumers
// get full autocomplete (e.g. `theme.color.primary['500']`).

/**
 * @param {{ dictionary: import('style-dictionary').Dictionary; options: { mode: 'light' | 'dark' } }} args
 * @returns {string}
 */
function formatThemeTypes({ dictionary, options }) {
    const tree = buildTree(dictionary.allTokens);
    const themeLiteral = emitLiteral(tree, 0);

    const isLight = options.mode === 'light';
    const header = `// Generated for ${options.mode} mode.\n// Do not edit — run \`yarn build:tokens\`.\n`;

    if (isLight) {
        return [header, `export const theme = ${themeLiteral} as const;\n`, `export type Theme = typeof theme;\n`].join(
            '\n'
        );
    }
    // Dark: emit values only; types come from Theme.
    return [header, `export const themeDark = ${themeLiteral} as const;\n`].join('\n');
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

function emitLiteral(value, depth) {
    const pad = '    '.repeat(depth);
    const padInner = '    '.repeat(depth + 1);

    if (typeof value === 'string') {
        return JSON.stringify(value);
    }
    if (typeof value === 'number') {
        return String(value);
    }

    const keys = Object.keys(value).sort();
    if (keys.length === 0) {
        return '{}';
    }

    const entries = keys.map((k) => {
        const v = value[k];
        const keyStr = /^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k);
        return `${padInner}${keyStr}: ${emitLiteral(v, depth + 1)},`;
    });
    return `{\n${entries.join('\n')}\n${pad}}`;
}

export default {
    name: 'nori-ui/theme-types',
    format: formatThemeTypes,
};
