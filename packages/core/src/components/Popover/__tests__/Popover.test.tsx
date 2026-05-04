import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Popover } from '../Popover';

// jsdom doesn't lay anything out — getBoundingClientRect returns zeros by
// default. Stub it so position math has something deterministic to chew on.
const TRIGGER_RECT = { top: 100, left: 200, width: 80, height: 32 };
const CONTENT_RECT = { width: 240, height: 60 };

beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
        configurable: true,
        value() {
            // testID is on the wrapper, but inner Pressable carries data-testid.
            const id = this.getAttribute?.('data-testid') ?? this.id ?? '';
            if (id.includes('content')) {
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

describe('<Popover>', () => {
    it('starts closed when defaultOpen is omitted', () => {
        render(
            <Popover>
                <Popover.Trigger asChild={false}>Open</Popover.Trigger>
                <Popover.Content testID="content">Hi</Popover.Content>
            </Popover>
        );
        expect(screen.queryByTestId('content')).toBeNull();
    });

    it('opens when the trigger is clicked', () => {
        render(
            <Popover>
                <Popover.Trigger asChild={false} testID="trigger">
                    Open
                </Popover.Trigger>
                <Popover.Content testID="content">Hi</Popover.Content>
            </Popover>
        );
        fireEvent.click(screen.getByTestId('trigger'));
        expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('toggles closed when trigger is clicked again', () => {
        render(
            <Popover>
                <Popover.Trigger asChild={false} testID="trigger">
                    Open
                </Popover.Trigger>
                <Popover.Content testID="content">Hi</Popover.Content>
            </Popover>
        );
        fireEvent.click(screen.getByTestId('trigger'));
        expect(screen.getByTestId('content')).toBeInTheDocument();
        fireEvent.click(screen.getByTestId('trigger'));
        expect(screen.queryByTestId('content')).toBeNull();
    });

    it('closes when clicking outside the content', () => {
        render(
            <div>
                <button type="button" data-testid="outside">
                    elsewhere
                </button>
                <Popover defaultOpen>
                    <Popover.Trigger asChild={false} testID="trigger">
                        Open
                    </Popover.Trigger>
                    <Popover.Content testID="content">Hi</Popover.Content>
                </Popover>
            </div>
        );
        expect(screen.getByTestId('content')).toBeInTheDocument();
        fireEvent.mouseDown(screen.getByTestId('outside'));
        expect(screen.queryByTestId('content')).toBeNull();
    });

    it('does NOT close when clicking inside the content', () => {
        render(
            <Popover defaultOpen>
                <Popover.Trigger asChild={false} testID="trigger">
                    Open
                </Popover.Trigger>
                <Popover.Content testID="content">
                    <button type="button" data-testid="inside">
                        action
                    </button>
                </Popover.Content>
            </Popover>
        );
        fireEvent.mouseDown(screen.getByTestId('inside'));
        expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('Escape closes the popover', () => {
        render(
            <Popover defaultOpen>
                <Popover.Trigger asChild={false}>Open</Popover.Trigger>
                <Popover.Content testID="content">Hi</Popover.Content>
            </Popover>
        );
        expect(screen.getByTestId('content')).toBeInTheDocument();
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(screen.queryByTestId('content')).toBeNull();
    });

    it('controlled: open prop drives visibility, onOpenChange fires on toggle', () => {
        const onOpenChange = jest.fn();
        const Wrapper = () => {
            const [open, setOpen] = useState(false);
            return (
                <Popover
                    open={open}
                    onOpenChange={(next) => {
                        onOpenChange(next);
                        setOpen(next);
                    }}
                >
                    <Popover.Trigger asChild={false} testID="trigger">
                        Open
                    </Popover.Trigger>
                    <Popover.Content testID="content">Hi</Popover.Content>
                </Popover>
            );
        };
        render(<Wrapper />);
        expect(screen.queryByTestId('content')).toBeNull();
        fireEvent.click(screen.getByTestId('trigger'));
        expect(onOpenChange).toHaveBeenCalledWith(true);
        expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('side="top" positions content above the trigger (y < trigger.top)', () => {
        render(
            <Popover defaultOpen>
                <Popover.Trigger asChild={false} testID="trigger">
                    Open
                </Popover.Trigger>
                <Popover.Content side="top" align="center" testID="content">
                    Hi
                </Popover.Content>
            </Popover>
        );
        // Content has to render once to measure itself, then position settles.
        const content = screen.getByTestId('content');
        const top = parseFloat((content.style.top as string) || '0');
        // side='top' anchors above: top should be < trigger.top.
        expect(top).toBeLessThan(TRIGGER_RECT.top);
    });

    it('align="end" right-aligns to the trigger\'s right edge', () => {
        render(
            <Popover defaultOpen>
                <Popover.Trigger asChild={false} testID="trigger">
                    Open
                </Popover.Trigger>
                <Popover.Content side="bottom" align="end" testID="content">
                    Hi
                </Popover.Content>
            </Popover>
        );
        const content = screen.getByTestId('content');
        const left = parseFloat((content.style.left as string) || '0');
        // align='end' on side='bottom' places content's right edge at the
        // trigger's right edge: left = trigger.left + trigger.width - content.width.
        const expectedLeft = TRIGGER_RECT.left + TRIGGER_RECT.width - CONTENT_RECT.width;
        expect(left).toBeCloseTo(expectedLeft, 0);
    });

    it('trigger gets aria-haspopup="dialog" and aria-expanded reflects open', () => {
        render(
            <Popover>
                <Popover.Trigger asChild={false} testID="trigger">
                    Open
                </Popover.Trigger>
                <Popover.Content testID="content">Hi</Popover.Content>
            </Popover>
        );
        const trigger = screen.getByTestId('trigger');
        expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
        fireEvent.click(trigger);
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('content gets role="dialog" without aria-modal (non-modal)', () => {
        render(
            <Popover defaultOpen>
                <Popover.Trigger asChild={false}>Open</Popover.Trigger>
                <Popover.Content testID="content" aria-label="Help">
                    Hi
                </Popover.Content>
            </Popover>
        );
        const content = screen.getByTestId('content');
        expect(content.getAttribute('role')).toBe('dialog');
        expect(content.getAttribute('aria-modal')).toBeNull();
    });

    it('throws when PopoverContent is rendered outside Popover', () => {
        const original = console.error;
        console.error = () => {};
        try {
            expect(() => render(<Popover.Content>x</Popover.Content>)).toThrow(/Popover/);
        } finally {
            console.error = original;
        }
    });
});
