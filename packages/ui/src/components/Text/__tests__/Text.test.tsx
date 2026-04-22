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
        // RN-Web maps role="heading" via aria-level
        const el = screen.getByTestId('t');
        expect(el.getAttribute('role')).toBe('heading');
    });
});
