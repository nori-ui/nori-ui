import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Radio, RadioGroup } from '../RadioGroup';

describe('<RadioGroup>', () => {
    it('renders all options inside a role="radiogroup"', () => {
        render(
            <RadioGroup defaultValue="b" testID="rg">
                <Radio value="a" label="A" testID="a" />
                <Radio value="b" label="B" testID="b" />
                <Radio value="c" label="C" testID="c" />
            </RadioGroup>
        );
        expect(screen.getByTestId('rg').getAttribute('role')).toBe('radiogroup');
        expect(screen.getAllByRole('radio')).toHaveLength(3);
    });

    it('marks defaultValue as checked', () => {
        render(
            <RadioGroup defaultValue="b">
                <Radio value="a" label="A" testID="a" />
                <Radio value="b" label="B" testID="b" />
            </RadioGroup>
        );
        expect(screen.getByTestId('a').getAttribute('aria-checked')).toBe('false');
        expect(screen.getByTestId('b').getAttribute('aria-checked')).toBe('true');
    });

    it('uncontrolled: clicking an option updates the selection', () => {
        render(
            <RadioGroup defaultValue="a">
                <Radio value="a" label="A" testID="a" />
                <Radio value="b" label="B" testID="b" />
            </RadioGroup>
        );
        fireEvent.click(screen.getByTestId('b'));
        expect(screen.getByTestId('a').getAttribute('aria-checked')).toBe('false');
        expect(screen.getByTestId('b').getAttribute('aria-checked')).toBe('true');
    });

    it('controlled: respects parent value, calls onChange on click', () => {
        const Wrapper = () => {
            const [v, setV] = useState('a');
            return (
                <>
                    <span data-testid="cur">{v}</span>
                    <RadioGroup value={v} onChange={setV}>
                        <Radio value="a" label="A" testID="a" />
                        <Radio value="b" label="B" testID="b" />
                    </RadioGroup>
                </>
            );
        };
        render(<Wrapper />);
        expect(screen.getByTestId('cur').textContent).toBe('a');
        fireEvent.click(screen.getByTestId('b'));
        expect(screen.getByTestId('cur').textContent).toBe('b');
        expect(screen.getByTestId('b').getAttribute('aria-checked')).toBe('true');
    });

    it('disabled at the group level prevents selection changes', () => {
        const onChange = jest.fn();
        render(
            <RadioGroup defaultValue="a" disabled onChange={onChange}>
                <Radio value="a" label="A" testID="a" />
                <Radio value="b" label="B" testID="b" />
            </RadioGroup>
        );
        fireEvent.click(screen.getByTestId('b'));
        expect(onChange).not.toHaveBeenCalled();
        expect(screen.getByTestId('a').getAttribute('aria-checked')).toBe('true');
    });

    it('disabled at the option level prevents that option from being selected', () => {
        render(
            <RadioGroup defaultValue="a">
                <Radio value="a" label="A" testID="a" />
                <Radio value="b" label="B" disabled testID="b" />
            </RadioGroup>
        );
        fireEvent.click(screen.getByTestId('b'));
        expect(screen.getByTestId('b').getAttribute('aria-checked')).toBe('false');
        expect(screen.getByTestId('a').getAttribute('aria-checked')).toBe('true');
    });

    it('ArrowDown moves selection to the next option (and wraps)', () => {
        render(
            <RadioGroup defaultValue="a" testID="rg">
                <Radio value="a" label="A" testID="a" />
                <Radio value="b" label="B" testID="b" />
                <Radio value="c" label="C" testID="c" />
            </RadioGroup>
        );
        const group = screen.getByTestId('rg');
        fireEvent.keyDown(group, { key: 'ArrowDown' });
        expect(screen.getByTestId('b').getAttribute('aria-checked')).toBe('true');
        fireEvent.keyDown(group, { key: 'ArrowDown' });
        expect(screen.getByTestId('c').getAttribute('aria-checked')).toBe('true');
        fireEvent.keyDown(group, { key: 'ArrowDown' });
        // wraps back to first
        expect(screen.getByTestId('a').getAttribute('aria-checked')).toBe('true');
    });

    it('Home / End jump to first / last option', () => {
        render(
            <RadioGroup defaultValue="b" testID="rg">
                <Radio value="a" label="A" testID="a" />
                <Radio value="b" label="B" testID="b" />
                <Radio value="c" label="C" testID="c" />
            </RadioGroup>
        );
        const group = screen.getByTestId('rg');
        fireEvent.keyDown(group, { key: 'End' });
        expect(screen.getByTestId('c').getAttribute('aria-checked')).toBe('true');
        fireEvent.keyDown(group, { key: 'Home' });
        expect(screen.getByTestId('a').getAttribute('aria-checked')).toBe('true');
    });

    it('throws a clear error when Radio is rendered outside a RadioGroup', () => {
        // Suppress React's expected error logging for cleaner test output.
        const original = console.error;
        console.error = () => {};
        try {
            expect(() => render(<Radio value="x" label="X" />)).toThrow(/RadioGroup/);
        } finally {
            console.error = original;
        }
    });
});
