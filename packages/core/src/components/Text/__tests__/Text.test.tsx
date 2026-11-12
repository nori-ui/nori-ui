import { render, screen } from '@testing-library/react';
import { Text } from '../Text';

describe('<Text>', () => {
    it('renders children as text content', () => {
        render(<Text>hello</Text>);
        expect(screen.getByText('hello')).toBeInTheDocument();
    });

    it('applies the default variant class (body-md) when no variant is given', () => {
        render(<Text testID="t">hello</Text>);
        const el = screen.getByTestId('t');
        expect(el.className).toMatch(/\bbody-md\b|text-base|text-md|text-\[16px\]/);
    });

    it('applies the requested variant class when variant is specified', () => {
        render(
            <Text variant="heading-1" testID="t">
                Hi
            </Text>
        );
        expect(screen.getByTestId('t').className).toMatch(/heading-1|text-4xl|text-\[36px\]/);
    });

    it('forwards consumer className so consumer classes win at build time', () => {
        render(
            <Text className="custom-color" testID="t">
                hello
            </Text>
        );
        expect(screen.getByTestId('t')).toHaveClass('custom-color');
    });

    it('uses accessibilityRole="header" for heading variants (a11y)', () => {
        render(
            <Text variant="heading-1" testID="t">
                H
            </Text>
        );
        const el = screen.getByTestId('t');
        expect(el.getAttribute('role')).toBe('heading');
    });

    it('gives each heading variant its own level instead of making them all level 1', () => {
        render(
            <>
                <Text variant="heading-1">One</Text>
                <Text variant="heading-2">Two</Text>
                <Text variant="heading-3">Three</Text>
            </>
        );
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('One');
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Two');
        expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Three');
    });

    it('lets the consumer override the heading level and the role', () => {
        render(
            <>
                <Text variant="heading-1" aria-level={4}>
                    Visually large
                </Text>
                <Text variant="heading-2" accessibilityRole="link" testID="link">
                    Styled link
                </Text>
            </>
        );
        expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('Visually large');
        expect(screen.getByTestId('link').getAttribute('role')).toBe('link');
    });
});
