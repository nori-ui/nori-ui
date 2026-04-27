import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Toggle, ToggleGroup, ToggleGroupItem } from '../Toggle';

describe('<Toggle>', () => {
    it('renders with role="button" and aria-pressed="false" by default', () => {
        render(
            <Toggle testID="t" aria-label="Bold">
                B
            </Toggle>
        );
        const el = screen.getByTestId('t');
        expect(el.getAttribute('role')).toBe('button');
        expect(el.getAttribute('aria-pressed')).toBe('false');
    });

    it('uncontrolled: defaultPressed seeds the initial state and click toggles it', () => {
        const onChange = jest.fn();
        render(
            <Toggle testID="t" defaultPressed onPressedChange={onChange}>
                B
            </Toggle>
        );
        const el = screen.getByTestId('t');
        expect(el.getAttribute('aria-pressed')).toBe('true');
        fireEvent.click(el);
        expect(onChange).toHaveBeenCalledWith(false);
        expect(el.getAttribute('aria-pressed')).toBe('false');
    });

    it('controlled: respects parent state, fires onPressedChange', () => {
        const Wrapper = () => {
            const [on, setOn] = useState(false);
            return (
                <Toggle testID="t" pressed={on} onPressedChange={setOn}>
                    Bold
                </Toggle>
            );
        };
        render(<Wrapper />);
        const el = screen.getByTestId('t');
        expect(el.getAttribute('aria-pressed')).toBe('false');
        fireEvent.click(el);
        expect(el.getAttribute('aria-pressed')).toBe('true');
    });

    it('does not fire onPressedChange when disabled', () => {
        const onChange = jest.fn();
        render(
            <Toggle testID="t" disabled onPressedChange={onChange}>
                B
            </Toggle>
        );
        fireEvent.click(screen.getByTestId('t'));
        expect(onChange).not.toHaveBeenCalled();
    });
});

describe('<ToggleGroup type="multiple">', () => {
    it('clicking adds and removes the value from the array', () => {
        const onValueChange = jest.fn();
        render(
            <ToggleGroup type="multiple" defaultValue={['bold']} onValueChange={onValueChange} aria-label="Formatting">
                <ToggleGroupItem value="bold" testID="bold">
                    B
                </ToggleGroupItem>
                <ToggleGroupItem value="italic" testID="italic">
                    I
                </ToggleGroupItem>
                <ToggleGroupItem value="underline" testID="underline">
                    U
                </ToggleGroupItem>
            </ToggleGroup>
        );
        const bold = screen.getByTestId('bold');
        const italic = screen.getByTestId('italic');
        expect(bold.getAttribute('aria-pressed')).toBe('true');
        expect(italic.getAttribute('aria-pressed')).toBe('false');

        fireEvent.click(italic);
        expect(onValueChange).toHaveBeenLastCalledWith(['bold', 'italic']);
        expect(italic.getAttribute('aria-pressed')).toBe('true');

        fireEvent.click(bold);
        expect(onValueChange).toHaveBeenLastCalledWith(['italic']);
        expect(bold.getAttribute('aria-pressed')).toBe('false');
    });

    it('uses role="group" for multiple selection', () => {
        render(
            <ToggleGroup type="multiple" testID="g">
                <ToggleGroupItem value="a">A</ToggleGroupItem>
                <ToggleGroupItem value="b">B</ToggleGroupItem>
            </ToggleGroup>
        );
        expect(screen.getByTestId('g').getAttribute('role')).toBe('group');
    });
});

describe('<ToggleGroup type="single">', () => {
    it('clicking sets the value; re-clicking the active one unsets it', () => {
        const onValueChange = jest.fn();
        render(
            <ToggleGroup type="single" onValueChange={onValueChange} aria-label="Align">
                <ToggleGroupItem value="left" testID="left">
                    L
                </ToggleGroupItem>
                <ToggleGroupItem value="center" testID="center">
                    C
                </ToggleGroupItem>
                <ToggleGroupItem value="right" testID="right">
                    R
                </ToggleGroupItem>
            </ToggleGroup>
        );
        const left = screen.getByTestId('left');
        const center = screen.getByTestId('center');

        fireEvent.click(left);
        expect(onValueChange).toHaveBeenLastCalledWith('left');
        expect(left.getAttribute('aria-pressed')).toBe('true');

        fireEvent.click(center);
        expect(onValueChange).toHaveBeenLastCalledWith('center');
        expect(left.getAttribute('aria-pressed')).toBe('false');
        expect(center.getAttribute('aria-pressed')).toBe('true');

        fireEvent.click(center);
        expect(onValueChange).toHaveBeenLastCalledWith(undefined);
        expect(center.getAttribute('aria-pressed')).toBe('false');
    });

    it('uses role="radiogroup" for single selection', () => {
        render(
            <ToggleGroup type="single" testID="g">
                <ToggleGroupItem value="a">A</ToggleGroupItem>
                <ToggleGroupItem value="b">B</ToggleGroupItem>
            </ToggleGroup>
        );
        expect(screen.getByTestId('g').getAttribute('role')).toBe('radiogroup');
    });
});

describe('<ToggleGroup> keyboard navigation', () => {
    it('ArrowRight on an item moves focus to the next item', () => {
        render(
            <ToggleGroup type="multiple">
                <ToggleGroupItem value="a" testID="a">
                    A
                </ToggleGroupItem>
                <ToggleGroupItem value="b" testID="b">
                    B
                </ToggleGroupItem>
                <ToggleGroupItem value="c" testID="c">
                    C
                </ToggleGroupItem>
            </ToggleGroup>
        );
        const a = screen.getByTestId('a');
        const b = screen.getByTestId('b');
        // jsdom needs the focus call before keydown so the item is the
        // event target — same pattern roving-tabindex uses in real browsers.
        act(() => a.focus());
        fireEvent.keyDown(a, { key: 'ArrowRight' });
        // After ArrowRight, the second item becomes the tab stop.
        expect(b.getAttribute('tabindex')).toBe('0');
        expect(a.getAttribute('tabindex')).toBe('-1');
    });

    it('Enter on a focused item toggles its pressed state', () => {
        const onValueChange = jest.fn();
        render(
            <ToggleGroup type="multiple" onValueChange={onValueChange}>
                <ToggleGroupItem value="a" testID="a">
                    A
                </ToggleGroupItem>
                <ToggleGroupItem value="b" testID="b">
                    B
                </ToggleGroupItem>
            </ToggleGroup>
        );
        const a = screen.getByTestId('a');
        act(() => a.focus());
        fireEvent.keyDown(a, { key: 'Enter' });
        expect(onValueChange).toHaveBeenLastCalledWith(['a']);
        expect(a.getAttribute('aria-pressed')).toBe('true');
    });
});

describe('<ToggleGroup> disabled handling', () => {
    it('a disabled item does not toggle when clicked', () => {
        const onValueChange = jest.fn();
        render(
            <ToggleGroup type="multiple" onValueChange={onValueChange}>
                <ToggleGroupItem value="a" testID="a">
                    A
                </ToggleGroupItem>
                <ToggleGroupItem value="b" disabled testID="b">
                    B
                </ToggleGroupItem>
            </ToggleGroup>
        );
        fireEvent.click(screen.getByTestId('b'));
        expect(onValueChange).not.toHaveBeenCalled();
        expect(screen.getByTestId('b').getAttribute('aria-pressed')).toBe('false');
    });

    it('group-level disabled blocks every item from toggling', () => {
        const onValueChange = jest.fn();
        render(
            <ToggleGroup type="multiple" disabled onValueChange={onValueChange}>
                <ToggleGroupItem value="a" testID="a">
                    A
                </ToggleGroupItem>
                <ToggleGroupItem value="b" testID="b">
                    B
                </ToggleGroupItem>
            </ToggleGroup>
        );
        fireEvent.click(screen.getByTestId('a'));
        expect(onValueChange).not.toHaveBeenCalled();
    });
});

describe('<ToggleGroupItem> outside <ToggleGroup>', () => {
    it('throws a clear error when rendered standalone', () => {
        const original = console.error;
        console.error = () => {};
        try {
            expect(() => render(<ToggleGroupItem value="x">X</ToggleGroupItem>)).toThrow(/ToggleGroup/);
        } finally {
            console.error = original;
        }
    });
});
