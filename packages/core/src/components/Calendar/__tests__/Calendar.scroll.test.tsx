import { CalendarDate } from '@internationalized/date';
import { fireEvent, render } from '@testing-library/react';
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

    it('header chevrons advance the focused month one panel at a time in scroll mode', () => {
        const { getByLabelText, container } = render(
            wrap(<Calendar behavior="scroll" defaultValue={d(2026, 5, 8)} />)
        );
        const next = getByLabelText(/next month/i);
        fireEvent.click(next);
        const focused = container.querySelector('[data-focused-month="true"]');
        expect(focused?.getAttribute('data-month-iso')).toBe('2026-06');
    });

    it('scrolls to a target month when the focused date changes', () => {
        const scrollIntoView = jest.fn();
        // jsdom doesn't implement scrollIntoView; install a stub before render so
        // the effect can find and call it on the target panel.
        Element.prototype.scrollIntoView = scrollIntoView as unknown as typeof Element.prototype.scrollIntoView;
        const { rerender } = render(wrap(<Calendar behavior="scroll" defaultValue={d(2026, 5, 8)} />));
        scrollIntoView.mockClear();
        rerender(wrap(<Calendar behavior="scroll" defaultValue={d(2026, 7, 8)} />));
        expect(scrollIntoView).toHaveBeenCalled();
    });
});
