import { render, screen } from '@testing-library/react';
import { HStack } from '../HStack';

describe('<HStack>', () => {
    it('applies flex-row by default', () => {
        render(<HStack testID="s">x</HStack>);
        expect(screen.getByTestId('s').className).toContain('flex-row');
    });

    it('maps gap prop to a spacing class', () => {
        render(
            <HStack gap={4} testID="s">
                x
            </HStack>
        );
        expect(screen.getByTestId('s').className).toContain('gap-4');
    });

    it('defaults gap to 0 (no gap class)', () => {
        render(<HStack testID="s">x</HStack>);
        expect(screen.getByTestId('s').className).not.toMatch(/\bgap-\d/);
    });

    it('supports vertical alignment via align prop', () => {
        render(
            <HStack align="center" testID="s">
                x
            </HStack>
        );
        expect(screen.getByTestId('s').className).toContain('items-center');
    });

    it('supports horizontal distribution via justify prop', () => {
        render(
            <HStack justify="between" testID="s">
                x
            </HStack>
        );
        expect(screen.getByTestId('s').className).toContain('justify-between');
    });

    it('forwards consumer className after internal defaults', () => {
        render(
            <HStack className="bg-red-500" testID="s">
                x
            </HStack>
        );
        expect(screen.getByTestId('s').className).toContain('bg-red-500');
    });
});
