import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Field } from '../../Field';
import { Checkbox } from '../Checkbox';

describe('<Checkbox>', () => {
    it('renders with role="checkbox" and aria-checked="false" by default', () => {
        render(<Checkbox testID="c" />);
        const el = screen.getByTestId('c');
        expect(el.getAttribute('role')).toBe('checkbox');
        expect(el.getAttribute('aria-checked')).toBe('false');
    });

    it('reflects checked prop via aria-checked', () => {
        render(<Checkbox testID="c" checked />);
        expect(screen.getByTestId('c').getAttribute('aria-checked')).toBe('true');
    });

    it('reflects indeterminate via aria-checked="mixed"', () => {
        render(<Checkbox testID="c" indeterminate />);
        expect(screen.getByTestId('c').getAttribute('aria-checked')).toBe('mixed');
    });

    it('uncontrolled: toggles on click and calls onChange with the new value', () => {
        const onChange = jest.fn();
        render(<Checkbox testID="c" onChange={onChange} />);
        fireEvent.click(screen.getByTestId('c'));
        expect(onChange).toHaveBeenCalledWith(true);
        fireEvent.click(screen.getByTestId('c'));
        expect(onChange).toHaveBeenLastCalledWith(false);
    });

    it('controlled: only changes when onChange re-renders with new checked', () => {
        function Wrapper() {
            const [v, setV] = useState(false);
            return <Checkbox testID="c" checked={v} onChange={setV} />;
        }
        render(<Wrapper />);
        const el = screen.getByTestId('c');
        expect(el.getAttribute('aria-checked')).toBe('false');
        fireEvent.click(el);
        expect(el.getAttribute('aria-checked')).toBe('true');
    });

    it('does not fire onChange when disabled', () => {
        const onChange = jest.fn();
        render(<Checkbox testID="c" onChange={onChange} disabled />);
        fireEvent.click(screen.getByTestId('c'));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('renders the visible label when provided and labels the checkbox', () => {
        render(<Checkbox testID="c" label="Accept terms" />);
        expect(screen.getByText('Accept terms')).toBeInTheDocument();
        expect(screen.getByTestId('c').getAttribute('aria-label')).toBe('Accept terms');
    });

    it('asChild: renders the single child as the interactive element, merging styling', () => {
        render(
            <Checkbox asChild>
                {/* biome-ignore lint/a11y/useSemanticElements: asChild pattern — test-only stub for Slot merging */}
                <div data-testid="c" role="checkbox" aria-checked="false" tabIndex={0} />
            </Checkbox>
        );
        expect(screen.getByTestId('c').getAttribute('role')).toBe('checkbox');
    });

    it('inside Field: receives id, aria-labelledby, aria-describedby from Field.Control', () => {
        render(
            <Field id="field-cb">
                <Field.Label>Accept terms</Field.Label>
                <Field.Description>Required to continue.</Field.Description>
                <Field.Control>
                    <Checkbox testID="c" label="Accept terms" />
                </Field.Control>
            </Field>
        );
        const el = screen.getByTestId('c');
        expect(el.getAttribute('id')).toBe('field-cb');
        expect(el.getAttribute('aria-labelledby')).toMatch(/field-cb-label/);
        expect(el.getAttribute('aria-describedby')).toMatch(/field-cb-desc/);
    });

    it('inside Field with error: receives aria-invalid from Field.Control', () => {
        render(
            <Field id="field-cb-err" error="Required">
                <Field.Label>Accept terms</Field.Label>
                <Field.Control>
                    <Checkbox testID="c" label="Accept terms" />
                </Field.Control>
                <Field.Error />
            </Field>
        );
        const el = screen.getByTestId('c');
        expect(el.getAttribute('aria-invalid')).toBe('true');
    });
});
