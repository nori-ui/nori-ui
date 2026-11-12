import { fireEvent, render } from '@testing-library/react-native';
import { NoriProvider } from '../../../../provider';
import { Stepper } from '../../Stepper';

const wrap = (ui: React.ReactElement) => render(<NoriProvider>{ui}</NoriProvider>);

describe('Stepper (native)', () => {
    it('renders titles, descriptions, and a spoken label per step', () => {
        const { getByText, getByLabelText } = wrap(
            <Stepper value={1} orientation="vertical">
                <Stepper.Step title="Cart" />
                <Stepper.Step title="Shipping" description="Address and method" />
                <Stepper.Step title="Payment" />
            </Stepper>
        );
        expect(getByText('Shipping')).toBeTruthy();
        expect(getByText('Address and method')).toBeTruthy();
        expect(getByLabelText('Step 1 of 3: Cart, completed')).toBeTruthy();
        expect(getByLabelText('Step 2 of 3: Shipping, current')).toBeTruthy();
        expect(getByLabelText('Step 3 of 3: Payment, upcoming')).toBeTruthy();
    });

    it('reports the index of a pressed completed step', () => {
        const onStepPress = jest.fn();
        const { getByLabelText } = wrap(
            <Stepper value={2} onStepPress={onStepPress}>
                <Stepper.Step title="Cart" />
                <Stepper.Step title="Shipping" />
                <Stepper.Step title="Payment" />
            </Stepper>
        );
        fireEvent.press(getByLabelText('Step 2 of 3: Shipping, completed'));
        expect(onStepPress).toHaveBeenCalledWith(1);
    });
});
