import { fireEvent, render } from '@testing-library/react-native';
import { NoriProvider } from '../../../../provider';
import { Rating } from '../../Rating';

const wrap = (ui: React.ReactElement) => render(<NoriProvider>{ui}</NoriProvider>);

describe('Rating (native)', () => {
    it('renders one labelled option per star and selects on press', () => {
        const onChange = jest.fn();
        const { getByLabelText } = wrap(<Rating defaultValue={1} onChange={onChange} />);
        expect(getByLabelText('1 star').props.accessibilityState.checked).toBe(true);
        fireEvent.press(getByLabelText('4 stars'));
        expect(onChange).toHaveBeenCalledWith(4);
        expect(getByLabelText('4 stars').props.accessibilityState.checked).toBe(true);
        expect(getByLabelText('1 star').props.accessibilityState.checked).toBe(false);
    });

    it('clears on a second press when allowClear is set', () => {
        const onChange = jest.fn();
        const { getByLabelText } = wrap(<Rating defaultValue={3} allowClear onChange={onChange} />);
        fireEvent.press(getByLabelText('3 stars'));
        expect(onChange).toHaveBeenCalledWith(0);
    });

    it('readOnly: exposes one labelled element and no options', () => {
        const { getByLabelText, queryByLabelText } = wrap(<Rating readOnly value={4.5} />);
        expect(getByLabelText('4.5 out of 5 stars')).toBeTruthy();
        expect(queryByLabelText('4 stars')).toBeNull();
    });
});
