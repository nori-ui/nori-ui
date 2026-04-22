// tokens/__tests__/build-contract.test.ts
// These tests assert the CONTRACT of the build pipeline, not implementation details.
// If any of these fail, downstream consumers (packages/ui, docs, playgrounds) will break.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const tokensRoot = path.resolve(__dirname, '..');
const buildDir = path.join(tokensRoot, 'build');

describe('tokens build contract', () => {
    beforeAll(() => {
        // Regenerate from source so the test reflects the current token tree, not a stale commit.
        execFileSync('node', ['src/config.mjs'], { cwd: tokensRoot, stdio: 'pipe' });
    });

    it('emits tailwind-preset.cjs that exports a Tailwind config with theme.extend', () => {
        const presetPath = path.join(buildDir, 'tailwind-preset.cjs');
        expect(existsSync(presetPath)).toBe(true);

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const preset = require(presetPath);
        expect(preset).toEqual(
            expect.objectContaining({
                darkMode: expect.any(Array),
                theme: expect.objectContaining({
                    extend: expect.objectContaining({
                        colors: expect.any(Object),
                        spacing: expect.any(Object),
                        borderRadius: expect.any(Object),
                        fontSize: expect.any(Object),
                        fontWeight: expect.any(Object),
                        lineHeight: expect.any(Object),
                        boxShadow: expect.any(Object),
                    }),
                }),
            })
        );
    });

    it('includes primary scale 50..900 in tailwind preset', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const preset = require(path.join(buildDir, 'tailwind-preset.cjs'));
        const primary = preset.theme.extend.colors.primary;
        for (const step of ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900']) {
            expect(primary[step]).toMatch(/^#[0-9a-f]{6}$/i);
        }
    });

    it('emits theme.ts with a typed `theme` const and `Theme` type', () => {
        const themeContent = readFileSync(path.join(buildDir, 'theme.ts'), 'utf8');
        expect(themeContent).toContain('export const theme');
        expect(themeContent).toContain('as const');
        expect(themeContent).toContain('export type Theme');
        expect(themeContent).toContain('export const themeDark');
    });

    it('resolves semantic aliases to concrete color values (no leaked {refs})', () => {
        const themeContent = readFileSync(path.join(buildDir, 'theme.ts'), 'utf8');
        // Broken references would leak "{color.primary.600}" strings into output.
        expect(themeContent).not.toMatch(/\{color\./);
    });

    it('emits theme.css with CSS custom properties', () => {
        const css = readFileSync(path.join(buildDir, 'theme.css'), 'utf8');
        expect(css).toContain('--color-primary-500');
        expect(css).toMatch(/:root\s*\{[^}]*--color-primary-500:/);
        expect(css).toMatch(/\[data-theme="dark"\]/);
    });

    it('is deterministic — two consecutive builds produce byte-identical outputs', () => {
        const first = readFileSync(path.join(buildDir, 'tailwind-preset.cjs'), 'utf8');
        execFileSync('node', ['src/config.mjs'], { cwd: tokensRoot, stdio: 'pipe' });
        const second = readFileSync(path.join(buildDir, 'tailwind-preset.cjs'), 'utf8');
        expect(second).toBe(first);
    });
});
