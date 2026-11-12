import { fireEvent, render } from '@testing-library/react-native';
import { NoriProvider } from '../../../../provider';
import { NumberInput } from '../../NumberInput';

const wrap = (ui: React.ReactElement) => render(<NoriProvider>{ui}</NoriProvider>);

describe('NumberInput (native)', () => {
    it('renders a text field with labelled stepper buttons', () => {
        const { getByTestId, getByRole } = wrap(<NumberInput testID="qty" defaultValue={2} />);
        expect(getByTestId('qty').props.value).toBe('2');
        expect(getByRole('button', { name: 'Increase value' })).toBeTruthy();
        expect(getByRole('button', { name: 'Decrease value' })).toBeTruthy();
    });

    it('keeps the text-field role so screen readers offer text editing', () => {
        const { getByTestId } = wrap(<NumberInput testID="qty" />);
        expect(getByTestId('qty').props.role).toBeUndefined();
    });

    it('picks the keyboard from precision and whether negatives are possible', () => {
        const { getByTestId, rerender } = wrap(<NumberInput testID="qty" min={0} />);
        expect(getByTestId('qty').props.keyboardType).toBe('number-pad');
        rerender(
            <NoriProvider>
                <NumberInput testID="qty" min={0} step={0.5} />
            </NoriProvider>
        );
        expect(getByTestId('qty').props.keyboardType).toBe('decimal-pad');
        // The number and decimal pads have no minus key.
        rerender(
            <NoriProvider>
                <NumberInput testID="qty" />
            </NoriProvider>
        );
        expect(['numbers-and-punctuation', 'numeric']).toContain(getByTestId('qty').props.keyboardType);
    });

    it('commits typed text on blur and on submit', () => {
        const onChange = jest.fn();
        const { getByTestId } = wrap(<NumberInput testID="qty" max={10} onChange={onChange} />);
        const input = getByTestId('qty');
        fireEvent.changeText(input, '42');
        expect(onChange).not.toHaveBeenCalled();
        fireEvent(input, 'blur');
        expect(onChange).toHaveBeenLastCalledWith(10);
        expect(getByTestId('qty').props.value).toBe('10');
        fireEvent.changeText(getByTestId('qty'), '3');
        fireEvent(getByTestId('qty'), 'submitEditing');
        expect(onChange).toHaveBeenLastCalledWith(3);
    });

    it('steps with the buttons and disables them at the bounds', () => {
        const onChange = jest.fn();
        const { getByTestId, getByRole } = wrap(
            <NumberInput testID="qty" defaultValue={0.1} step={0.1} max={0.3} onChange={onChange} />
        );
        fireEvent.press(getByRole('button', { name: 'Increase value' }));
        fireEvent.press(getByRole('button', { name: 'Increase value' }));
        expect(onChange).toHaveBeenLastCalledWith(0.3);
        expect(getByTestId('qty').props.value).toBe('0.3');
        expect(getByRole('button', { name: 'Increase value' })).toBeDisabled();
        expect(getByRole('button', { name: 'Decrease value' })).not.toBeDisabled();
    });

    it('disabled: not editable, buttons do nothing', () => {
        const onChange = jest.fn();
        const { getByTestId, getByRole } = wrap(
            <NumberInput testID="qty" defaultValue={1} disabled onChange={onChange} />
        );
        expect(getByTestId('qty').props.editable).toBe(false);
        fireEvent.press(getByRole('button', { name: 'Increase value' }));
        expect(onChange).not.toHaveBeenCalled();
    });
});
