import { render, screen } from '@testing-library/react';
import { forwardRef } from 'react';
import { Icon } from '../icon';

const Glyph = forwardRef<SVGSVGElement, { size?: number; color?: string }>(function Glyph({ size, color }, ref) {
    return <svg ref={ref} data-testid="g" width={size} height={size} color={color} />;
});

describe('<Icon>', () => {
    it('renders the `as` component with the given numeric size', () => {
        render(<Icon as={Glyph} size={24} />);
        const svg = screen.getByTestId('g');
        expect(svg).toHaveAttribute('width', '24');
        expect(svg).toHaveAttribute('height', '24');
    });

    it('maps keyword size to pixels', () => {
        render(<Icon as={Glyph} size="md" />);
        const svg = screen.getByTestId('g');
        expect(svg).toHaveAttribute('width', '20'); // md = 20
    });

    it('passes through color as a prop to the icon component', () => {
        render(<Icon as={Glyph} size={16} color="#ff0000" />);
        expect(screen.getByTestId('g')).toHaveAttribute('color', '#ff0000');
    });

    it('defaults to size md when no size prop is given', () => {
        render(<Icon as={Glyph} />);
        expect(screen.getByTestId('g')).toHaveAttribute('width', '20');
    });
});
