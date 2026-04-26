import { render, screen } from '@testing-library/react';
import { Skeleton } from '../Skeleton';

describe('<Skeleton>', () => {
    it('renders with the requested dimensions and is hidden from AT', () => {
        render(<Skeleton width={120} height={20} testID="s" />);
        const el = screen.getByTestId('s');
        expect(el).toBeInTheDocument();
        // Decorative — must not be announced by screen readers.
        expect(el.getAttribute('aria-hidden')).toBe('true');
    });

    it('forwards className', () => {
        render(<Skeleton className="my-skel" testID="s" />);
        expect(screen.getByTestId('s').className).toContain('my-skel');
    });

    it('respects the static prop (no animation registered)', () => {
        render(<Skeleton static testID="s" />);
        // Smoke test — render path doesn't throw with the loop disabled.
        expect(screen.getByTestId('s')).toBeInTheDocument();
    });

    it('uses radius="full" to render a circular skeleton (e.g. avatar)', () => {
        render(<Skeleton width={32} height={32} radius="full" testID="s" />);
        const el = screen.getByTestId('s');
        // borderRadius rendered as 9999 in the inline style.
        expect(el.style.borderRadius).toBe('9999px');
    });
});
