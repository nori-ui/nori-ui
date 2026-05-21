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
});
