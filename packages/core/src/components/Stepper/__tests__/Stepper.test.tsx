import { fireEvent, render, screen } from '@testing-library/react';
import { I18nProvider } from '../../../i18n/context';
import { Stepper } from '../Stepper';

const renderCheckout = (props: Partial<React.ComponentProps<typeof Stepper>> = {}) =>
    render(
        <Stepper value={1} {...props}>
            <Stepper.Step title="Cart" testID="cart" />
            <Stepper.Step title="Shipping" description="Address and method" testID="shipping" />
            <Stepper.Step title="Payment" testID="payment" />
            <Stepper.Step title="Review" testID="review" />
        </Stepper>
    );

describe('<Stepper>', () => {
    it('renders a named list with one list item per step', () => {
        renderCheckout();
        expect(screen.getByRole('list', { name: 'Progress' })).toBeTruthy();
        expect(screen.getAllByRole('listitem')).toHaveLength(4);
        expect(screen.getByText('Address and method')).toBeTruthy();
    });

    it('derives complete / current / upcoming from the index and names each step', () => {
        renderCheckout();
        const names = screen.getAllByRole('listitem').map((el) => el.getAttribute('aria-label'));
        expect(names).toEqual([
            'Step 1 of 4: Cart, completed',
            'Step 2 of 4: Shipping, current',
            'Step 3 of 4: Payment, upcoming',
            'Step 4 of 4: Review, upcoming',
        ]);
    });

    it('marks only the current step with aria-current="step"', () => {
        renderCheckout();
        const current = screen.getAllByRole('listitem').filter((el) => el.getAttribute('aria-current') === 'step');
        expect(current).toHaveLength(1);
        expect(current[0]).toBe(screen.getByTestId('shipping'));
    });

    it('shows step numbers for pending steps and replaces the number once a step is complete', () => {
        renderCheckout();
        expect(screen.queryByText('1')).toBeNull();
        expect(screen.getByText('2')).toBeTruthy();
        expect(screen.getByText('3')).toBeTruthy();
    });

    it('marks every step complete when value reaches the step count', () => {
        renderCheckout({ value: 4 });
        for (const item of screen.getAllByRole('listitem')) {
            expect(item.getAttribute('aria-label')).toMatch(/completed$/);
            expect(item.hasAttribute('aria-current')).toBe(false);
        }
    });

    it('lets `status` override the derived state, including error', () => {
        render(
            <Stepper value={2}>
                <Stepper.Step title="Cart" />
                <Stepper.Step title="Shipping" status="error" />
                <Stepper.Step title="Payment" />
            </Stepper>
        );
        const names = screen.getAllByRole('listitem').map((el) => el.getAttribute('aria-label'));
        expect(names[1]).toBe('Step 2 of 3: Shipping, error');
        expect(names[2]).toBe('Step 3 of 3: Payment, current');
    });

    it('onStepPress: only completed steps become buttons and report their index', () => {
        const onStepPress = jest.fn();
        renderCheckout({ value: 2, onStepPress });
        const buttons = screen.getAllByRole('button');
        expect(buttons.map((el) => el.getAttribute('aria-label'))).toEqual([
            'Step 1 of 4: Cart, completed',
            'Step 2 of 4: Shipping, completed',
        ]);
        fireEvent.click(buttons[1] as HTMLElement);
        expect(onStepPress).toHaveBeenCalledWith(1);
        // The name lives on the button, not twice.
        expect(screen.getByTestId('cart').hasAttribute('aria-label')).toBe(false);
    });

    it('renders no buttons without onStepPress', () => {
        renderCheckout({ value: 3 });
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('translates the list name, the step label, and the status', () => {
        render(
            <I18nProvider
                i18n={{
                    'stepper.ariaLabel': 'Fortschritt',
                    'stepper.stepLabel': 'Schritt {{step}} von {{total}}: {{title}}, {{status}}',
                    'stepper.status.current': 'aktuell',
                }}
            >
                <Stepper value={0}>
                    <Stepper.Step title="Warenkorb" />
                    <Stepper.Step title="Versand" />
                </Stepper>
            </I18nProvider>
        );
        expect(screen.getByRole('list', { name: 'Fortschritt' })).toBeTruthy();
        expect(screen.getAllByRole('listitem')[0]?.getAttribute('aria-label')).toBe(
            'Schritt 1 von 2: Warenkorb, aktuell'
        );
    });

    it('throws a clear error when a step is rendered outside a Stepper', () => {
        const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        expect(() => render(<Stepper.Step title="Lost" />)).toThrow(/direct child of a <Stepper>/);
        spy.mockRestore();
    });
});
