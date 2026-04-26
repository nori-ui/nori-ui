import { fireEvent, render, screen } from '@testing-library/react';
import { Avatar } from '../Avatar';

describe('<Avatar>', () => {
    it('renders the image when src is provided', () => {
        render(<Avatar src="https://example.com/x.png" name="Ada Lovelace" testID="a" />);
        const img = screen.getByTestId('a').querySelector('img');
        expect(img).not.toBeNull();
    });

    it('falls back to initials derived from name (first + last)', () => {
        render(<Avatar name="Ada Lovelace" testID="a" />);
        // No src → initials immediately
        expect(screen.getByTestId('a')).toHaveTextContent('AL');
    });

    it('uses a single initial when name is one word', () => {
        render(<Avatar name="Alex" testID="a" />);
        expect(screen.getByTestId('a')).toHaveTextContent('A');
    });

    it('falls back to neutral placeholder when no name and no src', () => {
        render(<Avatar testID="a" />);
        // No initials in the DOM — the neutral dot is the only visible content.
        expect(screen.getByTestId('a').textContent).toBe('');
    });

    it('renders custom fallback when provided', () => {
        render(<Avatar fallback={<span>★</span>} testID="a" />);
        expect(screen.getByTestId('a')).toHaveTextContent('★');
    });

    it('switches to fallback when the image fails to load', () => {
        render(<Avatar src="bad-url" name="Ada Lovelace" testID="a" />);
        const img = screen.getByTestId('a').querySelector('img');
        expect(img).not.toBeNull();
        // Simulate the image failing to load — onError fires, state flips to fallback.
        fireEvent.error(img as Element);
        expect(screen.getByTestId('a')).toHaveTextContent('AL');
    });

    it('exposes name as the accessibility label', () => {
        render(<Avatar name="Ada Lovelace" testID="a" />);
        expect(screen.getByTestId('a').getAttribute('aria-label')).toBe('Ada Lovelace');
    });
});
