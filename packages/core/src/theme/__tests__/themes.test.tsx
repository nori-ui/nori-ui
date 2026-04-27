/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '../context';
import { blueTheme, presetThemes, roseTheme, tealTheme } from '../themes';
import { useThemeColors } from '../use-theme-colors';

function PrimaryShown() {
    const colors = useThemeColors();
    return <span data-testid="p">{colors.semantic.interactive.primary}</span>;
}

describe('preset themes', () => {
    afterEach(() => {
        document.documentElement.classList.remove('dark');
    });

    it('default (no provider) resolves to the teal palette', () => {
        render(<PrimaryShown />);
        expect(screen.getByTestId('p')).toHaveTextContent(tealTheme.light.semantic.interactive.primary);
    });

    it('blueTheme via provider flips primary to blue-600 in light mode', () => {
        render(
            <ThemeProvider theme={blueTheme}>
                <PrimaryShown />
            </ThemeProvider>
        );
        expect(screen.getByTestId('p')).toHaveTextContent('#2563eb');
    });

    it('blueTheme flips to blue-400 in dark mode', async () => {
        render(
            <ThemeProvider theme={blueTheme}>
                <PrimaryShown />
            </ThemeProvider>
        );
        document.documentElement.classList.add('dark');
        await waitFor(() => {
            expect(screen.getByTestId('p')).toHaveTextContent('#60a5fa');
        });
    });

    it('roseTheme via provider flips primary to rose-600', () => {
        render(
            <ThemeProvider theme={roseTheme}>
                <PrimaryShown />
            </ThemeProvider>
        );
        expect(screen.getByTestId('p')).toHaveTextContent('#e11d48');
    });

    it('presetThemes exposes all six bundled themes', () => {
        const names = Object.keys(presetThemes).sort();
        expect(names).toEqual(['blue', 'orange', 'rose', 'slate', 'teal', 'violet']);
    });

    it('passing a single Theme object (not a NoriTheme pair) is accepted and used for both schemes', async () => {
        render(
            <ThemeProvider theme={blueTheme.light}>
                <PrimaryShown />
            </ThemeProvider>
        );
        // Light mode: blue-600
        expect(screen.getByTestId('p')).toHaveTextContent('#2563eb');
        // Even after flipping to dark, the same single-theme value is used
        document.documentElement.classList.add('dark');
        await waitFor(() => {
            expect(screen.getByTestId('p')).toHaveTextContent('#2563eb');
        });
    });
});
