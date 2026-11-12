import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { NoriProvider } from '../../../provider';
import { Field } from '../../Field';
import { Radio } from '../Radio';

describe('<Radio.Group>', () => {
    it('renders all options inside a role="radiogroup"', () => {
        render(
            <Radio.Group defaultValue="b" testID="rg">
                <Radio value="a" label="A" testID="a" />
                <Radio value="b" label="B" testID="b" />
                <Radio value="c" label="C" testID="c" />
            </Radio.Group>
        );
        expect(screen.getByTestId('rg').getAttribute('role')).toBe('radiogroup');
        expect(screen.getAllByRole('radio')).toHaveLength(3);
    });

    it('marks defaultValue as checked', () => {
        render(
            <Radio.Group defaultValue="b">
                <Radio value="a" label="A" testID="a" />
                <Radio value="b" label="B" testID="b" />
            </Radio.Group>
        );
        expect(screen.getByTestId('a').getAttribute('aria-checked')).toBe('false');
        expect(screen.getByTestId('b').getAttribute('aria-checked')).toBe('true');
    });

    it('uncontrolled: clicking an option updates the selection', () => {
        render(
            <Radio.Group defaultValue="a">
                <Radio value="a" label="A" testID="a" />
                <Radio value="b" label="B" testID="b" />
            </Radio.Group>
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
                    <Radio.Group value={v} onChange={setV}>
                        <Radio value="a" label="A" testID="a" />
                        <Radio value="b" label="B" testID="b" />
                    </Radio.Group>
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
            <Radio.Group defaultValue="a" disabled onChange={onChange}>
                <Radio value="a" label="A" testID="a" />
                <Radio value="b" label="B" testID="b" />
            </Radio.Group>
        );
        fireEvent.click(screen.getByTestId('b'));
        expect(onChange).not.toHaveBeenCalled();
        expect(screen.getByTestId('a').getAttribute('aria-checked')).toBe('true');
    });

    it('disabled at the option level prevents that option from being selected', () => {
        render(
            <Radio.Group defaultValue="a">
                <Radio value="a" label="A" testID="a" />
                <Radio value="b" label="B" disabled testID="b" />
            </Radio.Group>
        );
        fireEvent.click(screen.getByTestId('b'));
        expect(screen.getByTestId('b').getAttribute('aria-checked')).toBe('false');
        expect(screen.getByTestId('a').getAttribute('aria-checked')).toBe('true');
    });

    it('ArrowDown moves selection to the next option (and wraps)', () => {
        render(
            <Radio.Group defaultValue="a" testID="rg">
                <Radio value="a" label="A" testID="a" />
                <Radio value="b" label="B" testID="b" />
                <Radio value="c" label="C" testID="c" />
            </Radio.Group>
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
            <Radio.Group defaultValue="b" testID="rg">
                <Radio value="a" label="A" testID="a" />
                <Radio value="b" label="B" testID="b" />
                <Radio value="c" label="C" testID="c" />
            </Radio.Group>
        );
        const group = screen.getByTestId('rg');
        fireEvent.keyDown(group, { key: 'End' });
        expect(screen.getByTestId('c').getAttribute('aria-checked')).toBe('true');
        fireEvent.keyDown(group, { key: 'Home' });
        expect(screen.getByTestId('a').getAttribute('aria-checked')).toBe('true');
    });

    it('throws a clear error when Radio is rendered outside a Radio.Group', () => {
        // Suppress React's expected error logging for cleaner test output.
        const original = console.error;
        console.error = () => {};
        try {
            expect(() => render(<Radio value="x" label="X" />)).toThrow(/Radio\.Group/);
        } finally {
            console.error = original;
        }
    });
});

describe('<Radio.Group> inside <Field.Group>', () => {
    it('receives aria-labelledby and aria-invalid when wrapped in Field.Group with error', () => {
        render(
            <NoriProvider>
                <Field.Group error="pick one">
                    <Field.Label>Plan</Field.Label>
                    <Field.Control>
                        <Radio.Group value={undefined} onChange={() => {}} testID="rg">
                            <Radio value="a" label="A" />
                            <Radio value="b" label="B" />
                        </Radio.Group>
                    </Field.Control>
                    <Field.Error />
                </Field.Group>
            </NoriProvider>
        );
        const rg = screen.getByTestId('rg');
        expect(rg.getAttribute('aria-labelledby')).toBeTruthy();
        expect(rg.getAttribute('aria-invalid')).toBe('true');
    });

    it('receives aria-required when Field.Group is required', () => {
        render(
            <NoriProvider>
                <Field.Group required>
                    <Field.Label>Plan</Field.Label>
                    <Field.Control>
                        <Radio.Group value={undefined} onChange={() => {}} testID="rg">
                            <Radio value="a" label="A" />
                            <Radio value="b" label="B" />
                        </Radio.Group>
                    </Field.Control>
                </Field.Group>
            </NoriProvider>
        );
        const rg = screen.getByTestId('rg');
        expect(rg.getAttribute('aria-required')).toBe('true');
    });
});

describe('<Radio.Group> disabled options and naming', () => {
    it('arrow keys skip a disabled option', () => {
        const onChange = jest.fn();
        render(
            <Radio.Group defaultValue="a" onChange={onChange} testID="rg">
                <Radio value="a" label="A" testID="a" />
                <Radio value="b" label="B" disabled testID="b" />
                <Radio value="c" label="C" testID="c" />
            </Radio.Group>
        );
        fireEvent.keyDown(screen.getByTestId('rg'), { key: 'ArrowDown' });
        expect(onChange).toHaveBeenLastCalledWith('c');
        expect(screen.getByTestId('b').getAttribute('aria-checked')).toBe('false');
        expect(document.activeElement).toBe(screen.getByTestId('c'));
    });

    it('with no selection, only the first enabled option is a tab stop', () => {
        render(
            <Radio.Group>
                <Radio value="a" label="A" disabled testID="a" />
                <Radio value="b" label="B" testID="b" />
                <Radio value="c" label="C" testID="c" />
            </Radio.Group>
        );
        expect(screen.getByTestId('a').tabIndex).toBe(-1);
        expect(screen.getByTestId('b').tabIndex).toBe(0);
        expect(screen.getByTestId('c').tabIndex).toBe(-1);
    });

    it('does not override visible custom content with the raw value as aria-label', () => {
        render(
            <Radio.Group>
                <Radio value="plan_pro_monthly" testID="custom">
                    <span>Pro plan</span>
                </Radio>
                <Radio value="bare" testID="bare" />
            </Radio.Group>
        );
        expect(screen.getByTestId('custom').hasAttribute('aria-label')).toBe(false);
        expect(screen.getByTestId('bare').getAttribute('aria-label')).toBe('bare');
    });

    it('submits the selected value under the group name with an HTML form', () => {
        render(
            <form data-testid="form">
                <Radio.Group name="plan">
                    <Radio value="free" label="Free" />
                    <Radio value="pro" label="Pro" testID="pro" />
                </Radio.Group>
            </form>
        );
        const form = screen.getByTestId('form') as HTMLFormElement;
        expect(new FormData(form).get('plan')).toBeNull();
        fireEvent.click(screen.getByTestId('pro'));
        expect(new FormData(form).getAll('plan')).toEqual(['pro']);
    });
});
