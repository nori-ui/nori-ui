import { render, screen } from '@testing-library/react';
import { Separator } from '../Separator';

describe('<Separator>', () => {
    it('defaults to horizontal + decorative (role="none", no aria-orientation)', () => {
        render(<Separator testID="sep" />);
        const el = screen.getByTestId('sep');
        expect(el.getAttribute('role')).toBe('none');
        expect(el.getAttribute('aria-orientation')).toBeNull();
    });

    it('exposes role="separator" + aria-orientation when not decorative', () => {
        render(<Separator decorative={false} orientation="vertical" testID="sep" />);
        const el = screen.getByTestId('sep');
        expect(el.getAttribute('role')).toBe('separator');
        expect(el.getAttribute('aria-orientation')).toBe('vertical');
    });

    it('forwards className', () => {
        render(<Separator className="my-4" testID="sep" />);
        expect(screen.getByTestId('sep').className).toContain('my-4');
    });
});
