import type { CalendarProps, DateRange, DayContext } from '../index';
import { Calendar } from '../index';

it('Calendar barrel exports the component', () => {
    expect(Calendar).toBeDefined();
    expect(typeof Calendar).toBe('function');
});

it('Calendar barrel re-exports public types', () => {
    // Type-only assertions — proves the types are reachable via the barrel.
    const _props: CalendarProps = {};
    const _range: DateRange = {
        start: { year: 2026, month: 5, day: 1 } as never,
        end: null,
    };
    const _ctx: Partial<DayContext> = {};
    void _props;
    void _range;
    void _ctx;
    expect(true).toBe(true);
});
