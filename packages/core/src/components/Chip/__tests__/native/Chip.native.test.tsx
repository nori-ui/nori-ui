import { fireEvent, render } from '@testing-library/react-native';
import { NoriProvider } from '../../../../provider';
import { Chip } from '../../Chip';

const wrap = (ui: React.ReactElement) => render(<NoriProvider>{ui}</NoriProvider>);

describe('Chip (native)', () => {
    it('renders its label', () => {
        const { getByText } = wrap(<Chip>Draft</Chip>);
        expect(getByText('Draft')).toBeTruthy();
    });

    it('toggles selection on press', () => {
        const onSelectedChange = jest.fn();
        const { getByTestId } = wrap(
            <Chip testID="chip" defaultSelected={false} onSelectedChange={onSelectedChange}>
                Open
            </Chip>
        );
        const button = getByTestId('chip-button');
        expect(button.props.accessibilityState.selected).toBe(false);
        fireEvent.press(button);
        expect(onSelectedChange).toHaveBeenCalledWith(true);
        expect(getByTestId('chip-button').props.accessibilityState.selected).toBe(true);
    });

    it('fires onRemove from the labelled remove button only', () => {
        const onRemove = jest.fn();
        const onPress = jest.fn();
        const { getByLabelText } = wrap(
            <Chip onPress={onPress} onRemove={onRemove}>
                React
            </Chip>
        );
        fireEvent.press(getByLabelText('Remove React'));
        expect(onRemove).toHaveBeenCalledTimes(1);
        expect(onPress).not.toHaveBeenCalled();
    });

    it('group: reports the selected values', () => {
        const onChange = jest.fn();
        const { getByText } = wrap(
            <Chip.Group type="multiple" onChange={onChange}>
                <Chip value="a">A</Chip>
                <Chip value="b">B</Chip>
            </Chip.Group>
        );
        fireEvent.press(getByText('A'));
        fireEvent.press(getByText('B'));
        expect(onChange).toHaveBeenLastCalledWith(['a', 'b']);
    });
});
