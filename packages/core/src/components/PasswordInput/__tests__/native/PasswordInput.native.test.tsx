import { fireEvent, render } from '@testing-library/react-native';
import { NoriProvider } from '../../../../provider';
import { PasswordInput } from '../../PasswordInput';

const wrap = (ui: React.ReactElement) => render(<NoriProvider>{ui}</NoriProvider>);

describe('PasswordInput (native)', () => {
    it('masks the value and configures the keyboard for passwords', () => {
        const { getByTestId } = wrap(<PasswordInput testID="pw" />);
        const input = getByTestId('pw');
        expect(input.props.secureTextEntry).toBe(true);
        expect(input.props.autoCapitalize).toBe('none');
        expect(input.props.autoCorrect).toBe(false);
        expect(input.props.autoComplete).toBe('current-password');
    });

    it('the toggle reveals the value and its label names the next action', () => {
        const { getByTestId, getByRole, queryByRole } = wrap(<PasswordInput testID="pw" />);
        fireEvent.press(getByRole('button', { name: 'Show password' }));
        expect(getByTestId('pw').props.secureTextEntry).toBe(false);
        // Native has no pressed state, so the name itself flips.
        expect(queryByRole('button', { name: 'Show password' })).toBeNull();
        fireEvent.press(getByRole('button', { name: 'Hide password' }));
        expect(getByTestId('pw').props.secureTextEntry).toBe(true);
    });

    it('controlled: reports the next visibility without changing by itself', () => {
        const onVisibleChange = jest.fn();
        const { getByTestId, getByRole } = wrap(
            <PasswordInput testID="pw" visible={false} onVisibleChange={onVisibleChange} />
        );
        fireEvent.press(getByRole('button', { name: 'Show password' }));
        expect(onVisibleChange).toHaveBeenCalledWith(true);
        expect(getByTestId('pw').props.secureTextEntry).toBe(true);
    });

    it('disabled: the input is not editable and the toggle does nothing', () => {
        const onVisibleChange = jest.fn();
        const { getByTestId, getByRole } = wrap(
            <PasswordInput testID="pw" disabled onVisibleChange={onVisibleChange} />
        );
        expect(getByTestId('pw').props.editable).toBe(false);
        const toggle = getByRole('button', { name: 'Show password' });
        expect(toggle).toBeDisabled();
        fireEvent.press(toggle);
        expect(onVisibleChange).not.toHaveBeenCalled();
    });
});
