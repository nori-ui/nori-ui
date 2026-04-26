/**
 * @jest-environment jsdom
 */
import { themeDark as dark, theme as light } from '@nori-ui/tokens';
import { render, screen, waitFor } from '@testing-library/react';
import { useThemeColors } from '../use-theme-colors';

function ResolvedBg() {
    const colors = useThemeColors();
    return <span data-testid="bg">{colors.semantic.background.default}</span>;
}

describe('useThemeColors()', () => {
    afterEach(() => {
        document.documentElement.classList.remove('dark');
        document.documentElement.removeAttribute('data-theme');
    });

    it('returns the light palette when <html> has no dark signal', () => {
        render(<ResolvedBg />);
        expect(screen.getByTestId('bg')).toHaveTextContent(light.semantic.background.default);
    });

    it('flips to the dark palette when the `dark` class is added to <html>', async () => {
        render(<ResolvedBg />);
        document.documentElement.classList.add('dark');
        await waitFor(() => {
            expect(screen.getByTestId('bg')).toHaveTextContent(dark.semantic.background.default);
        });
    });

    it('also flips on `data-theme="dark"` (legacy switcher convention)', async () => {
        render(<ResolvedBg />);
        document.documentElement.setAttribute('data-theme', 'dark');
        await waitFor(() => {
            expect(screen.getByTestId('bg')).toHaveTextContent(dark.semantic.background.default);
        });
    });

    it('returns to the light palette when the `dark` signal is removed', async () => {
        document.documentElement.classList.add('dark');
        render(<ResolvedBg />);
        // Mount sees dark immediately.
        expect(screen.getByTestId('bg')).toHaveTextContent(dark.semantic.background.default);
        document.documentElement.classList.remove('dark');
        await waitFor(() => {
            expect(screen.getByTestId('bg')).toHaveTextContent(light.semantic.background.default);
        });
    });
});
