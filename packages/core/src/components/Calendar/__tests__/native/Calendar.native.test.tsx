import { CalendarDate } from '@internationalized/date';
import { fireEvent, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Calendar } from '../../Calendar';
import { NoriProvider } from '../../../../provider';

const wrap = (ui: ReactNode) => <NoriProvider locale="en-US">{ui}</NoriProvider>;
const d = (y: number, m: number, day: number) => new CalendarDate(y, m, day);

describe('Calendar — native smoke (single mode)', () => {
    it('renders day cells for the focused month', () => {
        const { getByLabelText } = render(wrap(<Calendar defaultValue={d(2026, 5, 8)} />));
        expect(getByLabelText(/May 8,\s+2026/i)).toBeTruthy();
    });

    it('fires onChange when a day cell is pressed', () => {
        const onChange = jest.fn();
        const { getByLabelText } = render(
            wrap(<Calendar defaultValue={d(2026, 5, 1)} onChange={onChange} />)
        );
        fireEvent.press(getByLabelText(/May 15,\s+2026/i));
        expect(onChange).toHaveBeenCalledTimes(1);
        const call = onChange.mock.calls[0];
        if (!call) {
            throw new Error('onChange was not called');
        }
        const [val, meta] = call;
        expect(val).toMatchObject({ year: 2026, month: 5, day: 15 });
        expect(meta).toMatchObject({ view: 'day', source: 'click' });
    });
});

describe('Calendar — native smoke (multiple mode)', () => {
    it('accumulates selected dates', () => {
        const onChange = jest.fn();
        const { getByLabelText } = render(
            wrap(<Calendar mode="multiple" defaultValue={[]} onChange={onChange} />)
        );
        fireEvent.press(getByLabelText(/May 1,\s+2026/i));
        fireEvent.press(getByLabelText(/May 3,\s+2026/i));
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
        expect(lastCall?.[0]).toHaveLength(2);
    });
});

describe('Calendar — native smoke (drilldown)', () => {
    it('opens the month grid when the header title is pressed', () => {
        const { getByText, queryByText } = render(wrap(<Calendar />));
        const titleLike = getByText(/May 2026|2026/i);
        fireEvent.press(titleLike);
        expect(queryByText(/Jan/i)).toBeTruthy();
        expect(queryByText(/Dec/i)).toBeTruthy();
    });
});
