import { act, fireEvent, render, screen } from '@testing-library/react';
import { HoverCard } from '../HoverCard.web';

// jsdom getBoundingClientRect stub so Popover can position content
beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
        configurable: true,
        value() {
            return {
                top: 100,
                left: 200,
                width: 80,
                height: 32,
                right: 280,
                bottom: 132,
                x: 200,
                y: 100,
                toJSON: () => ({}),
            };
        },
    });
});

function BasicHoverCard() {
    return (
        <HoverCard openDelay={0} closeDelay={0}>
            <HoverCard.Trigger testID="trigger">
                <button type="button">Hover me</button>
            </HoverCard.Trigger>
            <HoverCard.Content testID="content">
                <p>Card content</p>
            </HoverCard.Content>
        </HoverCard>
    );
}

describe('<HoverCard> web', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    it('content is not visible initially', () => {
        render(<BasicHoverCard />);
        expect(screen.queryByTestId('content')).toBeNull();
    });

    it('hover-in opens the card after openDelay', async () => {
        render(<BasicHoverCard />);
        const trigger = screen.getByTestId('trigger');
        fireEvent.mouseEnter(trigger);
        await act(async () => {
            jest.runAllTimers();
        });
        expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('hover-out closes the card after closeDelay', async () => {
        render(<BasicHoverCard />);
        const trigger = screen.getByTestId('trigger');
        fireEvent.mouseEnter(trigger);
        await act(async () => {
            jest.runAllTimers();
        });
        expect(screen.getByTestId('content')).toBeInTheDocument();

        fireEvent.mouseLeave(trigger);
        await act(async () => {
            jest.runAllTimers();
        });
        expect(screen.queryByTestId('content')).toBeNull();
    });

    it('trigger has aria-haspopup="dialog"', () => {
        render(<BasicHoverCard />);
        const trigger = screen.getByTestId('trigger');
        expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    });

    it('trigger aria-expanded reflects open state', async () => {
        render(<BasicHoverCard />);
        const trigger = screen.getByTestId('trigger');
        expect(trigger).toHaveAttribute('aria-expanded', 'false');

        fireEvent.mouseEnter(trigger);
        await act(async () => {
            jest.runAllTimers();
        });
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('respects openDelay', async () => {
        render(
            <HoverCard openDelay={300} closeDelay={0}>
                <HoverCard.Trigger testID="trigger">
                    <button type="button">Hover</button>
                </HoverCard.Trigger>
                <HoverCard.Content testID="content">Content</HoverCard.Content>
            </HoverCard>
        );
        const trigger = screen.getByTestId('trigger');
        fireEvent.mouseEnter(trigger);

        // Not yet open before the delay
        await act(async () => {
            jest.advanceTimersByTime(100);
        });
        expect(screen.queryByTestId('content')).toBeNull();

        // Open after the delay
        await act(async () => {
            jest.advanceTimersByTime(300);
        });
        expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('hover-out before openDelay cancels the open', async () => {
        render(
            <HoverCard openDelay={300} closeDelay={0}>
                <HoverCard.Trigger testID="trigger">
                    <button type="button">Hover</button>
                </HoverCard.Trigger>
                <HoverCard.Content testID="content">Content</HoverCard.Content>
            </HoverCard>
        );
        const trigger = screen.getByTestId('trigger');
        fireEvent.mouseEnter(trigger);
        await act(async () => {
            jest.advanceTimersByTime(100);
        });
        fireEvent.mouseLeave(trigger);
        await act(async () => {
            jest.runAllTimers();
        });
        expect(screen.queryByTestId('content')).toBeNull();
    });
});
