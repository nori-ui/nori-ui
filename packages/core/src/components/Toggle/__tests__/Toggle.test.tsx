import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Toggle } from '../Toggle';

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
            <Toggle testID="t" defaultPressed onChange={onChange}>
                B
            </Toggle>
        );
        const el = screen.getByTestId('t');
        expect(el.getAttribute('aria-pressed')).toBe('true');
        fireEvent.click(el);
        expect(onChange).toHaveBeenCalledWith(false);
        expect(el.getAttribute('aria-pressed')).toBe('false');
    });

    it('controlled: respects parent state, fires onChange', () => {
        const Wrapper = () => {
            const [on, setOn] = useState(false);
            return (
                <Toggle testID="t" pressed={on} onChange={setOn}>
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

    it('does not fire onChange when disabled', () => {
        const onChange = jest.fn();
        render(
            <Toggle testID="t" disabled onChange={onChange}>
                B
            </Toggle>
        );
        fireEvent.click(screen.getByTestId('t'));
        expect(onChange).not.toHaveBeenCalled();
    });
});

describe('<Toggle.Group type="multiple">', () => {
    it('clicking adds and removes the value from the array', () => {
        const onChange = jest.fn();
        render(
            <Toggle.Group type="multiple" defaultValue={['bold']} onChange={onChange} aria-label="Formatting">
                <Toggle.Item value="bold" testID="bold">
                    B
                </Toggle.Item>
                <Toggle.Item value="italic" testID="italic">
                    I
                </Toggle.Item>
                <Toggle.Item value="underline" testID="underline">
                    U
                </Toggle.Item>
            </Toggle.Group>
        );
        const bold = screen.getByTestId('bold');
        const italic = screen.getByTestId('italic');
        expect(bold.getAttribute('aria-pressed')).toBe('true');
        expect(italic.getAttribute('aria-pressed')).toBe('false');

        fireEvent.click(italic);
        expect(onChange).toHaveBeenLastCalledWith(['bold', 'italic']);
        expect(italic.getAttribute('aria-pressed')).toBe('true');

        fireEvent.click(bold);
        expect(onChange).toHaveBeenLastCalledWith(['italic']);
        expect(bold.getAttribute('aria-pressed')).toBe('false');
    });

    it('uses role="group" for multiple selection', () => {
        render(
            <Toggle.Group type="multiple" testID="g">
                <Toggle.Item value="a">A</Toggle.Item>
                <Toggle.Item value="b">B</Toggle.Item>
            </Toggle.Group>
        );
        expect(screen.getByTestId('g').getAttribute('role')).toBe('group');
    });
});

describe('<Toggle.Group type="single">', () => {
    it('clicking sets the value; re-clicking the active one unsets it', () => {
        const onChange = jest.fn();
        render(
            <Toggle.Group type="single" onChange={onChange} aria-label="Align">
                <Toggle.Item value="left" testID="left">
                    L
                </Toggle.Item>
                <Toggle.Item value="center" testID="center">
                    C
                </Toggle.Item>
                <Toggle.Item value="right" testID="right">
                    R
                </Toggle.Item>
            </Toggle.Group>
        );
        const left = screen.getByTestId('left');
        const center = screen.getByTestId('center');

        fireEvent.click(left);
        expect(onChange).toHaveBeenLastCalledWith('left');
        expect(left.getAttribute('aria-pressed')).toBe('true');

        fireEvent.click(center);
        expect(onChange).toHaveBeenLastCalledWith('center');
        expect(left.getAttribute('aria-pressed')).toBe('false');
        expect(center.getAttribute('aria-pressed')).toBe('true');

        fireEvent.click(center);
        expect(onChange).toHaveBeenLastCalledWith(undefined);
        expect(center.getAttribute('aria-pressed')).toBe('false');
    });

    it('uses role="radiogroup" for single selection', () => {
        render(
            <Toggle.Group type="single" testID="g">
                <Toggle.Item value="a">A</Toggle.Item>
                <Toggle.Item value="b">B</Toggle.Item>
            </Toggle.Group>
        );
        expect(screen.getByTestId('g').getAttribute('role')).toBe('radiogroup');
    });
});

describe('<Toggle.Group> keyboard navigation', () => {
    it('ArrowRight on an item moves focus to the next item', () => {
        render(
            <Toggle.Group type="multiple">
                <Toggle.Item value="a" testID="a">
                    A
                </Toggle.Item>
                <Toggle.Item value="b" testID="b">
                    B
                </Toggle.Item>
                <Toggle.Item value="c" testID="c">
                    C
                </Toggle.Item>
            </Toggle.Group>
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
        const onChange = jest.fn();
        render(
            <Toggle.Group type="multiple" onChange={onChange}>
                <Toggle.Item value="a" testID="a">
                    A
                </Toggle.Item>
                <Toggle.Item value="b" testID="b">
                    B
                </Toggle.Item>
            </Toggle.Group>
        );
        const a = screen.getByTestId('a');
        act(() => a.focus());
        fireEvent.keyDown(a, { key: 'Enter' });
        expect(onChange).toHaveBeenLastCalledWith(['a']);
        expect(a.getAttribute('aria-pressed')).toBe('true');
    });
});

describe('<Toggle.Group> disabled handling', () => {
    it('a disabled item does not toggle when clicked', () => {
        const onChange = jest.fn();
        render(
            <Toggle.Group type="multiple" onChange={onChange}>
                <Toggle.Item value="a" testID="a">
                    A
                </Toggle.Item>
                <Toggle.Item value="b" disabled testID="b">
                    B
                </Toggle.Item>
            </Toggle.Group>
        );
        fireEvent.click(screen.getByTestId('b'));
        expect(onChange).not.toHaveBeenCalled();
        expect(screen.getByTestId('b').getAttribute('aria-pressed')).toBe('false');
    });

    it('group-level disabled blocks every item from toggling', () => {
        const onChange = jest.fn();
        render(
            <Toggle.Group type="multiple" disabled onChange={onChange}>
                <Toggle.Item value="a" testID="a">
                    A
                </Toggle.Item>
                <Toggle.Item value="b" testID="b">
                    B
                </Toggle.Item>
            </Toggle.Group>
        );
        fireEvent.click(screen.getByTestId('a'));
        expect(onChange).not.toHaveBeenCalled();
    });
});

describe('<Toggle.Item> outside <Toggle.Group>', () => {
    it('throws a clear error when rendered standalone', () => {
        const original = console.error;
        console.error = () => {};
        try {
            expect(() => render(<Toggle.Item value="x">X</Toggle.Item>)).toThrow(/ToggleGroup/);
        } finally {
            console.error = original;
        }
    });
});
