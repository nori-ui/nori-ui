import { fireEvent, render } from '@testing-library/react-native';
import { NoriProvider } from '../../../../provider';
import { Slider } from '../../Slider';

const wrap = (ui: React.ReactElement) => render(<NoriProvider>{ui}</NoriProvider>);
const thumbLabel = () => 'Volume thumb';

describe('Slider (native)', () => {
    it('exposes each thumb to screen readers as an adjustable with its value', () => {
        const { getByLabelText } = wrap(
            <Slider defaultValue={[40]} min={0} max={100} ariaLabelForThumb={thumbLabel} />
        );
        const thumb = getByLabelText('Volume thumb');
        expect(thumb.props.accessible).toBe(true);
        expect(thumb.props.accessibilityRole).toBe('adjustable');
        expect(thumb.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 40 });
    });

    it('adjusts the value through increment / decrement accessibility actions', () => {
        const onChange = jest.fn();
        const { getByLabelText } = wrap(
            <Slider defaultValue={[40]} step={5} ariaLabelForThumb={thumbLabel} onChange={onChange} />
        );
        fireEvent(getByLabelText('Volume thumb'), 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
        expect(onChange).toHaveBeenLastCalledWith([45]);
        fireEvent(getByLabelText('Volume thumb'), 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
        expect(onChange).toHaveBeenLastCalledWith([40]);
    });
});
