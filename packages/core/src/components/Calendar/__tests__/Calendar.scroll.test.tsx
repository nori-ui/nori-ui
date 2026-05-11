import { CalendarDate } from '@internationalized/date';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { NoriProvider } from '../../../provider';
import { Calendar } from '../Calendar';

const d = (y: number, m: number, day: number) => new CalendarDate(y, m, day);
const wrap = (ui: ReactNode) => <NoriProvider locale="en-US">{ui}</NoriProvider>;

const installIO = () => {
    class FakeIO {
        callback: IntersectionObserverCallback;
        constructor(cb: IntersectionObserverCallback) {
            this.callback = cb;
        }
        observe() {}
        unobserve() {}
        disconnect() {}
        fire(entries: Partial<IntersectionObserverEntry>[]) {
            this.callback(entries as IntersectionObserverEntry[], this as unknown as IntersectionObserver);
        }
    }
    (globalThis as Record<string, unknown>).IntersectionObserver = FakeIO as unknown as typeof IntersectionObserver;
};

describe('Calendar — behavior="scroll" (web)', () => {
    beforeEach(() => {
        installIO();
    });

    it('renders the initial window of month panels around the focused date', () => {
        const { container } = render(wrap(<Calendar behavior="scroll" defaultValue={d(2026, 5, 8)} />));
        const panels = container.querySelectorAll('[data-month-panel]');
        expect(panels.length).toBe(37); // 12 past + focused + 24 future
    });

    it('warns and falls back to single column when visibleMonths > 1', () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
        const { container } = render(
            wrap(<Calendar behavior="scroll" visibleMonths={2} defaultValue={d(2026, 5, 8)} />)
        );
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('visibleMonths is ignored when behavior="scroll"')
        );
        const firstRow = container.querySelector('[data-scroll-row]');
        expect(firstRow?.querySelectorAll('[data-month-panel]').length).toBe(1);
        warn.mockRestore();
    });
});
