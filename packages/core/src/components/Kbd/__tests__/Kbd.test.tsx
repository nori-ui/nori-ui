import { render, screen } from '@testing-library/react';
import { Kbd } from '../Kbd';

describe('<Kbd>', () => {
    it('renders children', () => {
        render(<Kbd>⌘K</Kbd>);
        expect(screen.getByText('⌘K')).toBeTruthy();
    });

    it('renders multiple keys', () => {
        render(
            <>
                <Kbd>Ctrl</Kbd>
                <Kbd>S</Kbd>
            </>
        );
        expect(screen.getByText('Ctrl')).toBeTruthy();
        expect(screen.getByText('S')).toBeTruthy();
    });

    it('forwards className', () => {
        const { container } = render(<Kbd className="my-kbd">Esc</Kbd>);
        const el = container.firstChild as HTMLElement;
        expect(el.className).toContain('my-kbd');
    });
});
