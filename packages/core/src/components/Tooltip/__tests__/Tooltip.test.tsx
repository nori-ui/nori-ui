import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../Tooltip';

// jsdom doesn't lay anything out — getBoundingClientRect returns zeros by
// default. Stub it so the position math has something deterministic to chew on.
const TRIGGER_RECT = { top: 100, left: 200, width: 80, height: 32 };
const CONTENT_RECT = { width: 120, height: 28 };

beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
        configurable: true,
        value() {
            const id = this.getAttribute?.('data-testid') ?? this.id ?? '';
            const role = this.getAttribute?.('role') ?? '';
            if (id.includes('content') || role === 'tooltip') {
                return {
                    top: 0,
                    left: 0,
                    width: CONTENT_RECT.width,
                    height: CONTENT_RECT.height,
                    right: CONTENT_RECT.width,
                    bottom: CONTENT_RECT.height,
                    x: 0,
                    y: 0,
                    toJSON: () => ({}),
                };
            }
            return {
                top: TRIGGER_RECT.top,
                left: TRIGGER_RECT.left,
                width: TRIGGER_RECT.width,
                height: TRIGGER_RECT.height,
                right: TRIGGER_RECT.left + TRIGGER_RECT.width,
                bottom: TRIGGER_RECT.top + TRIGGER_RECT.height,
                x: TRIGGER_RECT.left,
                y: TRIGGER_RECT.top,
                toJSON: () => ({}),
            };
        },
    });
});

beforeEach(() => {
    jest.useFakeTimers();
});

afterEach(() => {
    act(() => {
        jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
});

describe('<Tooltip>', () => {
    it('starts closed when defaultOpen is omitted', () => {
        render(
            <Tooltip>
                <TooltipTrigger asChild={false}>Info</TooltipTrigger>
                <TooltipContent testID="content">Hint</TooltipContent>
            </Tooltip>
        );
        expect(screen.queryByTestId('content')).toBeNull();
    });

    it('opens after delayMs when the trigger is hovered', () => {
        render(
            <Tooltip delayMs={300}>
                <TooltipTrigger asChild={false} testID="trigger">
                    Info
                </TooltipTrigger>
                <TooltipContent testID="content">Hint</TooltipContent>
            </Tooltip>
        );
        fireEvent.mouseEnter(screen.getByTestId('trigger'));
        // Not open yet — still inside the delay window.
        expect(screen.queryByTestId('content')).toBeNull();
        act(() => {
            jest.advanceTimersByTime(300);
        });
        expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('disappears on mouseleave', () => {
        render(
            <Tooltip delayMs={0}>
                <TooltipTrigger asChild={false} testID="trigger">
                    Info
                </TooltipTrigger>
                <TooltipContent testID="content">Hint</TooltipContent>
            </Tooltip>
        );
        fireEvent.mouseEnter(screen.getByTestId('trigger'));
        act(() => {
            jest.advanceTimersByTime(0);
        });
        expect(screen.getByTestId('content')).toBeInTheDocument();
        fireEvent.mouseLeave(screen.getByTestId('trigger'));
        expect(screen.queryByTestId('content')).toBeNull();
    });

    it('Escape closes the tooltip', () => {
        render(
            <Tooltip defaultOpen>
                <TooltipTrigger asChild={false}>Info</TooltipTrigger>
                <TooltipContent testID="content">Hint</TooltipContent>
            </Tooltip>
        );
        expect(screen.getByTestId('content')).toBeInTheDocument();
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(screen.queryByTestId('content')).toBeNull();
    });

    it('focus opens the tooltip; blur closes it', () => {
        render(
            <Tooltip delayMs={0}>
                <TooltipTrigger asChild={false} testID="trigger">
                    Info
                </TooltipTrigger>
                <TooltipContent testID="content">Hint</TooltipContent>
            </Tooltip>
        );
        fireEvent.focus(screen.getByTestId('trigger'));
        act(() => {
            jest.advanceTimersByTime(0);
        });
        expect(screen.getByTestId('content')).toBeInTheDocument();
        fireEvent.blur(screen.getByTestId('trigger'));
        expect(screen.queryByTestId('content')).toBeNull();
    });

    it('controlled: open prop drives visibility, onOpenChange fires on hover-trigger', () => {
        const onOpenChange = jest.fn();
        const Wrapper = () => {
            const [open, setOpen] = useState(false);
            return (
                <Tooltip
                    open={open}
                    delayMs={0}
                    onOpenChange={(next) => {
                        onOpenChange(next);
                        setOpen(next);
                    }}
                >
                    <TooltipTrigger asChild={false} testID="trigger">
                        Info
                    </TooltipTrigger>
                    <TooltipContent testID="content">Hint</TooltipContent>
                </Tooltip>
            );
        };
        render(<Wrapper />);
        expect(screen.queryByTestId('content')).toBeNull();
        fireEvent.mouseEnter(screen.getByTestId('trigger'));
        act(() => {
            jest.advanceTimersByTime(0);
        });
        expect(onOpenChange).toHaveBeenCalledWith(true);
        expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('side="right" positions content to the right of the trigger (left > trigger.right)', () => {
        render(
            <Tooltip defaultOpen>
                <TooltipTrigger asChild={false} testID="trigger">
                    Info
                </TooltipTrigger>
                <TooltipContent side="right" align="center" testID="content">
                    Hint
                </TooltipContent>
            </Tooltip>
        );
        const content = screen.getByTestId('content');
        const left = parseFloat((content.style.left as string) || '0');
        // side='right' anchors to the right edge of the trigger:
        // left = trigger.left + trigger.width + GAP (4).
        expect(left).toBeGreaterThanOrEqual(TRIGGER_RECT.left + TRIGGER_RECT.width);
    });

    it('trigger gets aria-describedby pointing at content id when open', () => {
        render(
            <Tooltip defaultOpen>
                <TooltipTrigger asChild={false} testID="trigger">
                    Info
                </TooltipTrigger>
                <TooltipContent testID="content">Hint</TooltipContent>
            </Tooltip>
        );
        const trigger = screen.getByTestId('trigger');
        const content = screen.getByTestId('content');
        const describedBy = trigger.getAttribute('aria-describedby');
        expect(describedBy).toBeTruthy();
        expect(describedBy).toBe(content.getAttribute('id'));
    });

    it('content gets role="tooltip"', () => {
        render(
            <Tooltip defaultOpen>
                <TooltipTrigger asChild={false}>Info</TooltipTrigger>
                <TooltipContent testID="content">Hint</TooltipContent>
            </Tooltip>
        );
        const content = screen.getByTestId('content');
        expect(content.getAttribute('role')).toBe('tooltip');
    });

    it('throws when TooltipContent is rendered outside Tooltip', () => {
        const original = console.error;
        console.error = () => {};
        try {
            expect(() => render(<TooltipContent>x</TooltipContent>)).toThrow(/Tooltip/);
        } finally {
            console.error = original;
        }
    });
});
