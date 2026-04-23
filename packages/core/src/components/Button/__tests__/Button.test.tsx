import { fireEvent, render, screen } from '@testing-library/react';
import { Button } from '../Button';

describe('<Button>', () => {
    it('renders its children as the label', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole('button')).toHaveTextContent('Click me');
    });

    it('fires onPress when clicked', () => {
        const onPress = jest.fn();
        render(<Button onPress={onPress}>Go</Button>);
        fireEvent.click(screen.getByRole('button'));
        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('does not fire onPress when disabled', () => {
        const onPress = jest.fn();
        render(
            <Button onPress={onPress} disabled>
                Go
            </Button>
        );
        fireEvent.click(screen.getByRole('button'));
        expect(onPress).not.toHaveBeenCalled();
    });

    it('exposes disabled state to a11y via aria-disabled', () => {
        render(<Button disabled>Go</Button>);
        expect(screen.getByRole('button').getAttribute('aria-disabled')).toBe('true');
    });

    it('does not fire onPress while loading', () => {
        const onPress = jest.fn();
        render(
            <Button onPress={onPress} loading>
                Go
            </Button>
        );
        fireEvent.click(screen.getByRole('button'));
        expect(onPress).not.toHaveBeenCalled();
    });

    it('renders a spinner and aria-busy=true while loading', () => {
        render(
            <Button loading testID="b">
                Save
            </Button>
        );
        const btn = screen.getByTestId('b');
        expect(btn.getAttribute('aria-busy')).toBe('true');
        // Spinner child present:
        expect(btn.querySelector('[role="progressbar"]')).not.toBeNull();
    });

    it('applies the variant className (smoke check)', () => {
        render(
            <Button variant="destructive" testID="b">
                Delete
            </Button>
        );
        expect(screen.getByTestId('b').className).toMatch(/destructive|danger|red/);
    });

    it('applies the size className (smoke check)', () => {
        render(
            <Button size="lg" testID="b">
                Big
            </Button>
        );
        expect(screen.getByTestId('b').className).toMatch(/h-12|py-3|text-lg/);
    });

    it('renders a leading icon before the label', () => {
        function Arrow({ size }: { size?: number }) {
            return <svg data-testid="arrow" width={size} />;
        }
        render(<Button leadingIcon={Arrow}>Go</Button>);
        expect(screen.getByTestId('arrow')).toBeInTheDocument();
    });

    it('supports asChild — renders the child as the interactive element', () => {
        render(
            <Button asChild variant="primary">
                <a href="/x" data-testid="link">
                    Go
                </a>
            </Button>
        );
        const link = screen.getByTestId('link');
        expect(link.tagName).toBe('A');
        expect(link).toHaveAttribute('href', '/x');
        // Button styling reaches the anchor:
        expect(link.className).toMatch(/primary|bg-/);
    });
});
