import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { NoriProvider } from '../../../provider';
import { Field } from '../../Field';
import { NumberInput, type NumberInputProps } from '../NumberInput';

// The shared jsdom setup replaces `react-native` with a mock that forwards
// every prop to the DOM and does not route key events the way
// react-native-web does. Enter / arrow-key handling and the spinbutton
// attributes are only meaningful against the real thing.
jest.mock('react-native', () => jest.requireActual('react-native-web'));

const getInput = () => screen.getByRole('spinbutton') as HTMLInputElement;
const getIncrement = () => screen.getByRole('button', { name: 'Increase value' });
const getDecrement = () => screen.getByRole('button', { name: 'Decrease value' });

const type = (text: string) => fireEvent.change(getInput(), { target: { value: text } });
const typeAndBlur = (text: string) => {
    type(text);
    fireEvent.blur(getInput());
};

const Controlled = (props: NumberInputProps & { initial: number | null }) => {
    const { initial, onChange, ...rest } = props;
    const [value, setValue] = useState<number | null>(initial);
    return (
        <NumberInput
            {...rest}
            value={value}
            onChange={(next) => {
                setValue(next);
                onChange?.(next);
            }}
        />
    );
};

describe('<NumberInput>', () => {
    it('is a spinbutton that exposes its value and bounds', () => {
        render(<NumberInput defaultValue={3} min={1} max={10} />);
        const input = getInput();
        expect(input.value).toBe('3');
        expect(input).toHaveAttribute('aria-valuenow', '3');
        expect(input).toHaveAttribute('aria-valuemin', '1');
        expect(input).toHaveAttribute('aria-valuemax', '10');
    });

    it('an empty field has no aria-valuenow', () => {
        render(<NumberInput />);
        expect(getInput().value).toBe('');
        expect(getInput()).not.toHaveAttribute('aria-valuenow');
    });

    it('typing is free-form and commits on blur, not per keystroke', () => {
        const onChange = jest.fn();
        render(<NumberInput onChange={onChange} />);
        type('4');
        type('42');
        expect(getInput().value).toBe('42');
        expect(onChange).not.toHaveBeenCalled();
        fireEvent.blur(getInput());
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(42);
    });

    it('commits on Enter', () => {
        const onChange = jest.fn();
        render(<NumberInput onChange={onChange} />);
        type('7');
        fireEvent.keyDown(getInput(), { key: 'Enter' });
        expect(onChange).toHaveBeenCalledWith(7);
        expect(getInput()).toHaveAttribute('aria-valuenow', '7');
    });

    it('clamps the committed value to min and max', () => {
        const onChange = jest.fn();
        render(<NumberInput min={0} max={10} onChange={onChange} />);
        typeAndBlur('99');
        expect(onChange).toHaveBeenLastCalledWith(10);
        expect(getInput().value).toBe('10');
        typeAndBlur('-5');
        expect(onChange).toHaveBeenLastCalledWith(0);
        expect(getInput().value).toBe('0');
    });

    it('rounds the committed value to the precision derived from step', () => {
        const onChange = jest.fn();
        render(<NumberInput step={0.5} onChange={onChange} />);
        typeAndBlur('1.26');
        expect(onChange).toHaveBeenLastCalledWith(1.3);
        expect(getInput().value).toBe('1.3');
    });

    it('rounds to an integer by default', () => {
        const onChange = jest.fn();
        render(<NumberInput onChange={onChange} />);
        typeAndBlur('2.5');
        expect(onChange).toHaveBeenLastCalledWith(3);
    });

    it('an explicit precision rounds half up exactly and pads the display', () => {
        const onChange = jest.fn();
        render(<NumberInput precision={2} onChange={onChange} />);
        // 1.005 * 100 is 100.49999… in binary floating point.
        typeAndBlur('1.005');
        expect(onChange).toHaveBeenLastCalledWith(1.01);
        typeAndBlur('1.5');
        expect(getInput().value).toBe('1.50');
    });

    it('clearing the field commits null', () => {
        const onChange = jest.fn();
        render(<NumberInput defaultValue={5} onChange={onChange} />);
        typeAndBlur('');
        expect(onChange).toHaveBeenCalledWith(null);
        expect(getInput().value).toBe('');
    });

    it('text that is not a number is discarded and the previous value restored', () => {
        const onChange = jest.fn();
        render(<NumberInput defaultValue={5} onChange={onChange} />);
        typeAndBlur('abc');
        expect(onChange).not.toHaveBeenCalled();
        expect(getInput().value).toBe('5');
    });

    it('does not call onChange when the committed value is unchanged', () => {
        const onChange = jest.fn();
        render(<NumberInput defaultValue={5} onChange={onChange} />);
        typeAndBlur('5.0');
        expect(onChange).not.toHaveBeenCalled();
        expect(getInput().value).toBe('5');
    });

    it('the stepper buttons change the value by step', () => {
        const onChange = jest.fn();
        render(<NumberInput defaultValue={10} step={5} onChange={onChange} />);
        fireEvent.click(getIncrement());
        expect(onChange).toHaveBeenLastCalledWith(15);
        fireEvent.click(getDecrement());
        fireEvent.click(getDecrement());
        expect(onChange).toHaveBeenLastCalledWith(5);
        expect(getInput().value).toBe('5');
    });

    it('stepping decimals leaves no floating-point artifacts', () => {
        const onChange = jest.fn();
        render(<NumberInput defaultValue={0.1} step={0.1} onChange={onChange} />);
        fireEvent.click(getIncrement());
        fireEvent.click(getIncrement());
        expect(onChange).toHaveBeenLastCalledWith(0.3);
        expect(getInput().value).toBe('0.3');
    });

    it('ArrowUp and ArrowDown step the value', () => {
        const onChange = jest.fn();
        render(<NumberInput defaultValue={1} onChange={onChange} />);
        fireEvent.keyDown(getInput(), { key: 'ArrowUp' });
        fireEvent.keyDown(getInput(), { key: 'ArrowUp' });
        expect(onChange).toHaveBeenLastCalledWith(3);
        fireEvent.keyDown(getInput(), { key: 'ArrowDown' });
        expect(onChange).toHaveBeenLastCalledWith(2);
        expect(getInput().value).toBe('2');
    });

    it('stepping starts from text that was typed but not yet committed', () => {
        const onChange = jest.fn();
        render(<NumberInput defaultValue={1} onChange={onChange} />);
        type('20');
        fireEvent.keyDown(getInput(), { key: 'ArrowUp' });
        expect(onChange).toHaveBeenLastCalledWith(21);
    });

    it('stepping an empty field starts from zero, within the bounds', () => {
        const onChange = jest.fn();
        const { unmount } = render(<NumberInput onChange={onChange} />);
        fireEvent.click(getIncrement());
        expect(onChange).toHaveBeenLastCalledWith(1);
        unmount();
        render(<NumberInput min={5} onChange={onChange} />);
        fireEvent.click(getIncrement());
        expect(onChange).toHaveBeenLastCalledWith(5);
    });

    it('disables the stepper buttons at the bounds and never steps past them', () => {
        const onChange = jest.fn();
        render(<NumberInput defaultValue={9} min={0} max={10} onChange={onChange} />);
        expect(getIncrement()).not.toBeDisabled();
        fireEvent.click(getIncrement());
        expect(getIncrement()).toBeDisabled();
        expect(getDecrement()).not.toBeDisabled();
        fireEvent.keyDown(getInput(), { key: 'ArrowUp' });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getInput().value).toBe('10');
        typeAndBlur('0');
        expect(getDecrement()).toBeDisabled();
    });

    it('keeps the stepper buttons out of the tab order and focus in the input', () => {
        render(<NumberInput />);
        expect(getIncrement()).toHaveAttribute('tabindex', '-1');
        expect(getDecrement()).toHaveAttribute('tabindex', '-1');
        // A canceled mousedown is what keeps the browser from moving focus.
        expect(fireEvent.mouseDown(getIncrement())).toBe(false);
    });

    it('controlled: displays the value prop and reverts when the parent rejects a change', () => {
        const onChange = jest.fn();
        const { rerender } = render(<NumberInput value={4} onChange={onChange} />);
        typeAndBlur('8');
        expect(onChange).toHaveBeenCalledWith(8);
        expect(getInput().value).toBe('4');
        rerender(<NumberInput value={8} onChange={onChange} />);
        expect(getInput().value).toBe('8');
        rerender(<NumberInput value={null} onChange={onChange} />);
        expect(getInput().value).toBe('');
    });

    it('controlled: round-trips through parent state', () => {
        render(<Controlled initial={1} min={0} max={3} />);
        fireEvent.click(getIncrement());
        fireEvent.click(getIncrement());
        expect(getInput().value).toBe('3');
        expect(getIncrement()).toBeDisabled();
    });

    it('disabled: blocks typing, keys, and both buttons', () => {
        const onChange = jest.fn();
        render(<NumberInput defaultValue={2} disabled onChange={onChange} />);
        expect(getInput()).toBeDisabled();
        expect(getIncrement()).toBeDisabled();
        expect(getDecrement()).toBeDisabled();
        fireEvent.click(getIncrement());
        fireEvent.keyDown(getInput(), { key: 'ArrowUp' });
        expect(onChange).not.toHaveBeenCalled();
    });

    it('comma locales: accepts and displays a decimal comma, and still accepts a dot', () => {
        const onChange = jest.fn();
        render(
            <NoriProvider locale="de-DE">
                <NumberInput step={0.1} onChange={onChange} />
            </NoriProvider>
        );
        typeAndBlur('1,5');
        expect(onChange).toHaveBeenLastCalledWith(1.5);
        expect(getInput().value).toBe('1,5');
        typeAndBlur('2.5');
        expect(onChange).toHaveBeenLastCalledWith(2.5);
        typeAndBlur('1.234,5');
        expect(onChange).toHaveBeenLastCalledWith(1234.5);
    });

    it('dot locales: a comma is not a number', () => {
        const onChange = jest.fn();
        render(
            <NoriProvider locale="en-US">
                <NumberInput defaultValue={1} step={0.1} onChange={onChange} />
            </NoriProvider>
        );
        typeAndBlur('1,5');
        expect(onChange).not.toHaveBeenCalled();
        expect(getInput().value).toBe('1');
    });

    it('translates the stepper labels', () => {
        render(
            <NoriProvider i18n={{ 'numberInput.increment': 'Erhöhen', 'numberInput.decrement': 'Verringern' }}>
                <NumberInput />
            </NoriProvider>
        );
        expect(screen.getByRole('button', { name: 'Erhöhen' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Verringern' })).toBeInTheDocument();
    });

    it('forwards placeholder, id, testID, and aria-label to the input', () => {
        render(<NumberInput placeholder="0" id="qty" testID="qty-input" aria-label="Quantity" />);
        const input = screen.getByRole('spinbutton', { name: 'Quantity' });
        expect(input).toHaveAttribute('placeholder', '0');
        expect(input).toHaveAttribute('id', 'qty');
        expect(screen.getByTestId('qty-input')).toBe(input);
    });

    it('inside Field: is labelled, described, and marked invalid by the Field', () => {
        render(
            <NoriProvider>
                <Field label="Quantity" description="Between 1 and 10." error="Required." required>
                    <NumberInput min={1} max={10} />
                </Field>
            </NoriProvider>
        );
        const input = screen.getByRole('spinbutton', { name: /Quantity/ });
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).toHaveAttribute('aria-required', 'true');
        expect(input).toHaveAccessibleDescription('Between 1 and 10. Required.');
    });
});
