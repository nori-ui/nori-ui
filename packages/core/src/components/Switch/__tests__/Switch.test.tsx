import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Field } from '../../Field';
import { Switch } from '../Switch';

describe('<Switch>', () => {
    it('renders with role="switch" and aria-checked="false" by default', () => {
        render(<Switch testID="s" />);
        const el = screen.getByTestId('s');
        expect(el.getAttribute('role')).toBe('switch');
        expect(el.getAttribute('aria-checked')).toBe('false');
    });

    it('reflects checked prop', () => {
        render(<Switch testID="s" checked />);
        expect(screen.getByTestId('s').getAttribute('aria-checked')).toBe('true');
    });

    it('uncontrolled: toggles and calls onChange', () => {
        const onChange = jest.fn();
        render(<Switch testID="s" onChange={onChange} />);
        fireEvent.click(screen.getByTestId('s'));
        expect(onChange).toHaveBeenCalledWith(true);
    });

    it('controlled: obeys parent state', () => {
        function Wrapper() {
            const [v, setV] = useState(false);
            return <Switch testID="s" checked={v} onChange={setV} />;
        }
        render(<Wrapper />);
        const el = screen.getByTestId('s');
        fireEvent.click(el);
        expect(el.getAttribute('aria-checked')).toBe('true');
    });

    it('does not fire onChange when disabled', () => {
        const onChange = jest.fn();
        render(<Switch testID="s" onChange={onChange} disabled />);
        fireEvent.click(screen.getByTestId('s'));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('renders visible label and uses it as accessibilityLabel', () => {
        render(<Switch testID="s" label="Dark mode" />);
        expect(screen.getByText('Dark mode')).toBeInTheDocument();
        expect(screen.getByTestId('s').getAttribute('aria-label')).toBe('Dark mode');
    });

    it('asChild: renders the child with combined styling + role', () => {
        render(
            <Switch asChild>
                <div data-testid="s" role="switch" aria-checked="false" tabIndex={0} />
            </Switch>
        );
        expect(screen.getByTestId('s').getAttribute('role')).toBe('switch');
    });

    it('inside Field: receives id, aria-labelledby, aria-describedby from Field.Control', () => {
        render(
            <Field id="field-sw">
                <Field.Label>Notifications</Field.Label>
                <Field.Description>Choose how you'd like to be notified.</Field.Description>
                <Field.Control>
                    <Switch testID="s" label="Email digests" />
                </Field.Control>
            </Field>
        );
        const el = screen.getByTestId('s');
        expect(el.getAttribute('id')).toBe('field-sw');
        expect(el.getAttribute('aria-labelledby')).toMatch(/field-sw-label/);
        expect(el.getAttribute('aria-describedby')).toMatch(/field-sw-desc/);
    });

    it('inside Field with error: receives aria-invalid from Field.Control', () => {
        render(
            <Field id="field-sw-err" error="Required">
                <Field.Label>Notifications</Field.Label>
                <Field.Control>
                    <Switch testID="s" label="Email digests" />
                </Field.Control>
                <Field.Error />
            </Field>
        );
        const el = screen.getByTestId('s');
        expect(el.getAttribute('aria-invalid')).toBe('true');
    });
});
