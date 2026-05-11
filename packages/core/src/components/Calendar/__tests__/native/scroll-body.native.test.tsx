import { CalendarDate } from '@internationalized/date';
import { render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { NoriProvider } from '../../../../provider';
import { Calendar } from '../../Calendar';

const d = (y: number, m: number, day: number) => new CalendarDate(y, m, day);
const wrap = (ui: ReactNode) => <NoriProvider locale="en-US">{ui}</NoriProvider>;

describe('Calendar — behavior="scroll" (native)', () => {
    it('mounts the flash-calendar wrapper with the configured window', () => {
        const { getByTestId, getByText } = render(wrap(<Calendar behavior="scroll" defaultValue={d(2026, 5, 8)} />));
        expect(getByTestId('flash-calendar-mock')).toBeTruthy();
        expect(getByText('past=12')).toBeTruthy();
        expect(getByText('future=24')).toBeTruthy();
        expect(getByText(/initial=2026-05/)).toBeTruthy();
    });

    it('warns and falls back to single column when visibleMonths > 1', () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
        render(wrap(<Calendar behavior="scroll" visibleMonths={3} defaultValue={d(2026, 5, 8)} />));
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('visibleMonths is ignored when behavior="scroll"'));
        warn.mockRestore();
    });
});
