import { fireEvent, render, screen } from '@testing-library/react';
import { Alert } from '../Alert';

describe('<Alert>', () => {
    it('renders title and description with role="alert" so AT announces it', () => {
        render(<Alert title="Heads up" description="Saved with warnings" testID="a" />);
        const el = screen.getByTestId('a');
        expect(el.getAttribute('role')).toBe('alert');
        expect(el).toHaveTextContent('Heads up');
        expect(el).toHaveTextContent('Saved with warnings');
    });

    it('does not render a dismiss button when onDismiss is omitted', () => {
        render(<Alert title="Hi" testID="a" />);
        expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull();
    });

    it('renders dismiss button + fires onDismiss when present', () => {
        const onDismiss = jest.fn();
        render(<Alert title="Hi" onDismiss={onDismiss} testID="a" />);
        const btn = screen.getByRole('button', { name: 'Dismiss' });
        fireEvent.click(btn);
        expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('accepts a custom icon override (icon=null suppresses it)', () => {
        render(<Alert title="Bare" icon={null} testID="a" />);
        // No svg should render when icon is suppressed.
        expect(screen.getByTestId('a').querySelector('svg')).toBeNull();
    });
});
