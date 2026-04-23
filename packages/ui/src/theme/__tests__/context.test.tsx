import { theme as defaultTheme, type Theme } from '@nori-ui/tokens';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../context';
import { useTheme } from '../use-theme';

function PrimaryColorDisplay() {
    const t = useTheme();
    return <span data-testid="c">{t.color.primary['500']}</span>;
}

describe('<ThemeProvider> + useTheme()', () => {
    it('returns the default light theme when no provider wraps the tree', () => {
        render(<PrimaryColorDisplay />);
        expect(screen.getByTestId('c')).toHaveTextContent(defaultTheme.color.primary['500']);
    });

    it('returns the provided theme when a provider is present', () => {
        const custom: Theme = {
            ...defaultTheme,
            color: {
                ...defaultTheme.color,
                primary: { ...defaultTheme.color.primary, '500': '#ff00ff' },
            },
        };
        render(
            <ThemeProvider theme={custom}>
                <PrimaryColorDisplay />
            </ThemeProvider>
        );
        expect(screen.getByTestId('c')).toHaveTextContent('#ff00ff');
    });
});
