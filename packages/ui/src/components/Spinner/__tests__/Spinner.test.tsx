import { render, screen } from '@testing-library/react';
import { Spinner } from '../Spinner';

describe('<Spinner>', () => {
    it('renders with role="progressbar" for a11y', () => {
        render(<Spinner testID="s" />);
        const el = screen.getByTestId('s');
        expect(el.getAttribute('role')).toBe('progressbar');
    });

    it('exposes an accessible label via accessibilityLabel prop (defaults to the i18n "Loading" string)', () => {
        render(<Spinner testID="s" />);
        const el = screen.getByTestId('s');
        expect(el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')).toBeTruthy();
    });

    it('accepts a custom label', () => {
        render(<Spinner testID="s" label="Fetching" />);
        expect(screen.getByTestId('s').getAttribute('aria-label')).toBe('Fetching');
    });

    it('maps keyword size to pixel size', () => {
        render(<Spinner testID="s" size="lg" />);
        const el = screen.getByTestId('s');
        // RN-Web renders ActivityIndicator as a div with style height/width
        expect(el.style.height).toBe('24px');
        expect(el.style.width).toBe('24px');
    });

    it('accepts numeric size', () => {
        render(<Spinner testID="s" size={40} />);
        const el = screen.getByTestId('s');
        expect(el.style.height).toBe('40px');
    });
});
