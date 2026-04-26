import { act, fireEvent, render, screen } from '@testing-library/react';
import { ToastProvider, useToast } from '../Toast';

const Trigger = ({ label = 'fire', tone }: { label?: string; tone?: 'success' | 'danger' }) => {
    const { toast } = useToast();
    return (
        <button
            type="button"
            data-testid="fire"
            onClick={() => toast({ title: label, ...(tone !== undefined ? { tone } : {}) })}
        >
            fire
        </button>
    );
};

describe('<ToastProvider> + useToast()', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });
    afterEach(() => {
        act(() => {
            jest.runOnlyPendingTimers();
        });
        jest.useRealTimers();
    });

    it('renders nothing in the viewport when no toasts are queued', () => {
        render(
            <ToastProvider>
                <span>app</span>
            </ToastProvider>
        );
        // No region label means the viewport is collapsed.
        expect(screen.queryByRole('region', { name: 'Notifications' })).toBeNull();
    });

    it('toast() shows the message in the viewport', () => {
        render(
            <ToastProvider>
                <Trigger label="Saved" />
            </ToastProvider>
        );
        fireEvent.click(screen.getByTestId('fire'));
        expect(screen.getByRole('region', { name: 'Notifications' })).toBeInTheDocument();
        expect(screen.getByText('Saved')).toBeInTheDocument();
    });

    it('auto-dismisses after the default duration', () => {
        render(
            <ToastProvider>
                <Trigger label="Saved" />
            </ToastProvider>
        );
        fireEvent.click(screen.getByTestId('fire'));
        expect(screen.getByText('Saved')).toBeInTheDocument();
        act(() => {
            jest.advanceTimersByTime(5000);
        });
        expect(screen.queryByText('Saved')).toBeNull();
    });

    it('Infinity duration keeps the toast open', () => {
        const InfinityTrigger = () => {
            const { toast } = useToast();
            return (
                <button
                    type="button"
                    data-testid="fire"
                    onClick={() => toast({ title: 'Sticky', duration: Number.POSITIVE_INFINITY })}
                >
                    fire
                </button>
            );
        };
        render(
            <ToastProvider>
                <InfinityTrigger />
            </ToastProvider>
        );
        fireEvent.click(screen.getByTestId('fire'));
        act(() => {
            jest.advanceTimersByTime(60_000);
        });
        expect(screen.getByText('Sticky')).toBeInTheDocument();
    });

    it('manual dismiss removes the toast', () => {
        render(
            <ToastProvider>
                <Trigger label="Saved" />
            </ToastProvider>
        );
        fireEvent.click(screen.getByTestId('fire'));
        const close = screen.getByRole('button', { name: 'Dismiss notification' });
        fireEvent.click(close);
        expect(screen.queryByText('Saved')).toBeNull();
    });

    it('useToast() throws outside ToastProvider', () => {
        const original = console.error;
        console.error = () => {};
        try {
            const Bad = () => {
                useToast();
                return null;
            };
            expect(() => render(<Bad />)).toThrow(/ToastProvider/);
        } finally {
            console.error = original;
        }
    });
});
