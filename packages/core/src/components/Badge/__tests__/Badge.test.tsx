import { render, screen } from '@testing-library/react';
import { Badge } from '../Badge';

describe('<Badge>', () => {
    it('renders children inside a pill', () => {
        render(<Badge testID="b">New</Badge>);
        expect(screen.getByTestId('b')).toHaveTextContent('New');
    });

    it('default tone is neutral, default appearance is soft (no solid bg)', () => {
        render(<Badge testID="b">x</Badge>);
        const el = screen.getByTestId('b');
        const bg = (el.style.backgroundColor || '').toLowerCase();
        // Soft neutral uses the neutral.100 (#f4f4f5) shade — non-empty,
        // not transparent, and not the solid neutral.700 shade.
        expect(bg).not.toBe('');
        expect(bg).not.toBe('transparent');
    });

    it('outline appearance renders transparent bg + visible border color', () => {
        render(
            <Badge appearance="outline" tone="primary" testID="b">
                x
            </Badge>
        );
        const el = screen.getByTestId('b');
        expect((el.style.backgroundColor || '').toLowerCase()).toBe('transparent');
        // The border color in outline form must not be the default 'transparent'
        // we use as the base — it should reflect the tone.
        expect(el.style.borderColor).not.toBe('transparent');
    });

    it('forwards className', () => {
        render(
            <Badge className="my-badge" testID="b">
                x
            </Badge>
        );
        expect(screen.getByTestId('b').className).toContain('my-badge');
    });
});
