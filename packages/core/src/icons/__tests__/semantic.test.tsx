import { render, screen } from '@testing-library/react';
import { SemanticIconsProvider } from '../semantic-context';
import { useSemanticIcon } from '../use-semantic-icon';

function CheckmarkRenderer() {
    const Mark = useSemanticIcon('checkmark');
    return <Mark size={16} />;
}

describe('semantic icons', () => {
    it('renders the default checkmark SVG when no provider', () => {
        const { container } = render(<CheckmarkRenderer />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders an overridden icon when provider supplies one', () => {
        function CustomMark({ size }: { size?: number }) {
            return <span data-testid="custom">mark-{size}</span>;
        }
        render(
            <SemanticIconsProvider icons={{ checkmark: CustomMark }}>
                <CheckmarkRenderer />
            </SemanticIconsProvider>
        );
        expect(screen.getByTestId('custom')).toHaveTextContent('mark-16');
    });
});
