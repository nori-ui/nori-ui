import { fireEvent, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { NoriProvider } from '../../../../provider';
import { InputOTP } from '../../InputOTP';

const wrap = (ui: ReactNode) => <NoriProvider locale="en-US">{ui}</NoriProvider>;

function Controlled({ onComplete }: { onComplete?: (v: string) => void }) {
    const [value, setValue] = useState('');
    return <InputOTP value={value} onChange={setValue} onComplete={onComplete} length={4} testID="otp" />;
}

describe('<InputOTP> native', () => {
    it('renders 4 cells', () => {
        const { getByTestId } = render(wrap(<Controlled />));
        for (let i = 0; i < 4; i++) {
            expect(getByTestId(`otp-cell-${i}`)).toBeTruthy();
        }
    });

    it('typing in first cell updates value', () => {
        const { getByTestId } = render(wrap(<Controlled />));
        const cell0 = getByTestId('otp-cell-0');
        fireEvent.changeText(cell0, '5');
        // Cell 0 should now show '5'
        expect(cell0.props.value).toBe('5');
    });

    it('onComplete fires when all cells are filled via paste-like input', () => {
        const onComplete = jest.fn();
        const { getByTestId } = render(wrap(<Controlled onComplete={onComplete} />));
        // On native, pasting all chars at once in first cell
        const cell0 = getByTestId('otp-cell-0');
        fireEvent.changeText(cell0, '1234');
        expect(onComplete).toHaveBeenCalledWith('1234');
    });

    it('does not call onComplete if not fully filled', () => {
        const onComplete = jest.fn();
        const { getByTestId } = render(wrap(<Controlled onComplete={onComplete} />));
        const cell0 = getByTestId('otp-cell-0');
        fireEvent.changeText(cell0, '1');
        expect(onComplete).not.toHaveBeenCalled();
    });

    it('disabled disables all cells', () => {
        const { getByTestId } = render(wrap(<InputOTP value="12" length={4} disabled testID="otp" />));
        const cell0 = getByTestId('otp-cell-0');
        // editable=false translates to accessibilityState.disabled on native
        expect(cell0.props.editable).toBe(false);
    });

    it('Backspace on a filled cell reports the change once', () => {
        const onChange = jest.fn();
        const { getByTestId } = render(wrap(<InputOTP value="12" onChange={onChange} length={4} testID="otp" />));
        const cell1 = getByTestId('otp-cell-1');
        // A device sends the key press first, then the resulting text change.
        fireEvent(cell1, 'keyPress', { nativeEvent: { key: 'Backspace' } });
        fireEvent.changeText(cell1, '');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('1');
    });

    it('typing into a filled cell replaces its character', () => {
        const onChange = jest.fn();
        const { getByTestId } = render(wrap(<InputOTP value="1" onChange={onChange} length={4} testID="otp" />));
        fireEvent.changeText(getByTestId('otp-cell-0'), '17');
        expect(onChange).toHaveBeenCalledWith('7');
    });

    it('exposes every cell to screen readers with its own label', () => {
        const { getByLabelText, getByTestId } = render(wrap(<Controlled />));
        expect(getByLabelText('One-time code, Digit 1 of 4')).toBeTruthy();
        expect(getByLabelText('One-time code, Digit 4 of 4')).toBeTruthy();
        // An `accessible` container would collapse the cells into one element.
        expect(getByTestId('otp').props.accessible).not.toBe(true);
    });

    it('disabled: text changes are ignored', () => {
        const onChange = jest.fn();
        const { getByTestId } = render(
            wrap(<InputOTP value="12" onChange={onChange} length={4} disabled testID="otp" />)
        );
        fireEvent(getByTestId('otp-cell-0'), 'changeText', '9876');
        expect(onChange).not.toHaveBeenCalled();
    });
});
