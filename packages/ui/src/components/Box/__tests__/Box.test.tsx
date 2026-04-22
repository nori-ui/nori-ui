import { render, screen } from '@testing-library/react';
import { Box } from '../Box';

describe('<Box>', () => {
    it('renders children inside a View-backed element', () => {
        render(<Box testID="b">content</Box>);
        const el = screen.getByTestId('b');
        expect(el).toBeInTheDocument();
        expect(el).toHaveTextContent('content');
    });

    it('forwards className', () => {
        render(<Box className="p-4 bg-white" testID="b" />);
        expect(screen.getByTestId('b').className).toContain('p-4');
        expect(screen.getByTestId('b').className).toContain('bg-white');
    });

    it('accepts and forwards accessibility props', () => {
        render(
            <Box testID="b" accessibilityLabel="card" accessibilityRole="summary">
                c
            </Box>
        );
        const el = screen.getByTestId('b');
        expect(el.getAttribute('aria-label')).toBe('card');
    });
});
