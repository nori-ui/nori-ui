import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { NoriProvider } from '../../../provider';
import { Field } from '../../Field';
import { PasswordInput } from '../PasswordInput';

// The shared jsdom setup replaces `react-native` with a mock that forwards
// every prop to the DOM. Whether the password is masked is decided by what
// react-native-web really emits (`type="password"`), so these tests run
// against the real thing.
jest.mock('react-native', () => jest.requireActual('react-native-web'));

const getInput = () => screen.getByTestId('pw') as HTMLInputElement;
const getToggle = () => screen.getByRole('button', { name: 'Show password' });

describe('<PasswordInput>', () => {
    it('masks the value by default and offers an unpressed "Show password" button', () => {
        render(<PasswordInput testID="pw" defaultValue="hunter2" />);
        expect(getInput().type).toBe('password');
        expect(getToggle().tagName).toBe('BUTTON');
        expect(getToggle()).toHaveAttribute('aria-pressed', 'false');
    });

    it('uncontrolled: the toggle reveals and re-masks the value', () => {
        render(<PasswordInput testID="pw" defaultValue="hunter2" />);
        fireEvent.click(getToggle());
        expect(getInput().type).toBe('text');
        expect(getInput().value).toBe('hunter2');
        expect(getToggle()).toHaveAttribute('aria-pressed', 'true');
        fireEvent.click(getToggle());
        expect(getInput().type).toBe('password');
        expect(getToggle()).toHaveAttribute('aria-pressed', 'false');
    });

    it('defaultVisible starts revealed', () => {
        render(<PasswordInput testID="pw" defaultVisible />);
        expect(getInput().type).toBe('text');
        expect(getToggle()).toHaveAttribute('aria-pressed', 'true');
    });

    it('controlled: reports the next visibility and follows the visible prop only', () => {
        const onVisibleChange = jest.fn();
        const { rerender } = render(<PasswordInput testID="pw" visible={false} onVisibleChange={onVisibleChange} />);
        fireEvent.click(getToggle());
        expect(onVisibleChange).toHaveBeenCalledWith(true);
        // The parent did not update `visible`, so the value stays masked.
        expect(getInput().type).toBe('password');
        rerender(<PasswordInput testID="pw" visible onVisibleChange={onVisibleChange} />);
        expect(getInput().type).toBe('text');
        fireEvent.click(getToggle());
        expect(onVisibleChange).toHaveBeenLastCalledWith(false);
    });

    it('keeps typed text when toggling', () => {
        function Wrapper() {
            const [value, setValue] = useState('');
            return <PasswordInput testID="pw" value={value} onChangeText={setValue} />;
        }
        render(<Wrapper />);
        fireEvent.change(getInput(), { target: { value: 's3cret' } });
        fireEvent.click(getToggle());
        expect(getInput().value).toBe('s3cret');
    });

    it('a pointer press on the toggle does not take focus away from the input', () => {
        render(<PasswordInput testID="pw" />);
        act(() => getInput().focus());
        // fireEvent returns false when the handler called preventDefault; a
        // canceled mousedown is what keeps the browser from moving focus.
        expect(fireEvent.mouseDown(getToggle())).toBe(false);
        fireEvent.click(getToggle());
        expect(document.activeElement).toBe(getInput());
    });

    it('defaults to current-password autofill and lets the consumer override it', () => {
        const { rerender } = render(<PasswordInput testID="pw" />);
        expect(getInput()).toHaveAttribute('autocomplete', 'current-password');
        expect(getInput()).toHaveAttribute('autocapitalize', 'none');
        rerender(<PasswordInput testID="pw" autoComplete="new-password" />);
        expect(getInput()).toHaveAttribute('autocomplete', 'new-password');
    });

    it('disabled: blocks both the input and the toggle', () => {
        const onVisibleChange = jest.fn();
        render(<PasswordInput testID="pw" disabled onVisibleChange={onVisibleChange} />);
        expect(getInput()).toBeDisabled();
        expect(getToggle()).toBeDisabled();
        fireEvent.click(getToggle());
        expect(onVisibleChange).not.toHaveBeenCalled();
        expect(getInput().type).toBe('password');
    });

    it('translates the toggle label', () => {
        render(
            <NoriProvider i18n={{ 'input.passwordShow': 'Passwort anzeigen' }}>
                <PasswordInput testID="pw" />
            </NoriProvider>
        );
        expect(screen.getByRole('button', { name: 'Passwort anzeigen' })).toBeInTheDocument();
    });

    it('exposes the input through ref', () => {
        const ref = { current: null as { focus: () => void } | null };
        render(<PasswordInput testID="pw" ref={ref as never} />);
        act(() => ref.current?.focus());
        expect(document.activeElement).toBe(getInput());
    });

    it('inside Field: is labelled, described, and marked invalid by the Field', () => {
        render(
            <NoriProvider>
                <Field label="Password" description="At least 12 characters." error="Too short.">
                    <PasswordInput testID="pw" />
                </Field>
            </NoriProvider>
        );
        const input = screen.getByLabelText('Password');
        expect(input).toBe(getInput());
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).toHaveAccessibleDescription('At least 12 characters. Too short.');
        // The toggle still works when the Field clones props onto the input.
        fireEvent.click(getToggle());
        expect(getInput().type).toBe('text');
    });

    it('inside a disabled Field: input and toggle are disabled', () => {
        render(
            <NoriProvider>
                <Field label="Password" disabled>
                    <PasswordInput testID="pw" />
                </Field>
            </NoriProvider>
        );
        expect(getInput()).toBeDisabled();
        expect(getToggle()).toBeDisabled();
    });
});
