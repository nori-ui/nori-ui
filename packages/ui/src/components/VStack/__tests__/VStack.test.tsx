import { render, screen } from '@testing-library/react';
import { VStack } from '../VStack';

describe('<VStack>', () => {
    it('applies flex-col by default', () => {
        render(<VStack testID="s">x</VStack>);
        expect(screen.getByTestId('s').className).toContain('flex-col');
    });

    it('maps gap prop to a spacing class', () => {
        render(
            <VStack gap={6} testID="s">
                x
            </VStack>
        );
        expect(screen.getByTestId('s').className).toContain('gap-6');
    });

    it('supports align and justify props', () => {
        render(
            <VStack align="stretch" justify="center" testID="s">
                x
            </VStack>
        );
        const el = screen.getByTestId('s');
        expect(el.className).toContain('items-stretch');
        expect(el.className).toContain('justify-center');
    });

    it('forwards consumer className', () => {
        render(
            <VStack className="p-4" testID="s">
                x
            </VStack>
        );
        expect(screen.getByTestId('s').className).toContain('p-4');
    });
});
