import { CalendarDate } from '@internationalized/date';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Profiler, useState } from 'react';
import { NoriProvider } from '../../../../provider';
import { Calendar } from '../../Calendar';

const d = (y: number, m: number, day: number) => new CalendarDate(y, m, day);

const BUDGET_MS = 100; // generous; catches order-of-magnitude regressions only

describe('Calendar — native perf (informational)', () => {
    it('paged month-change commit phase stays under budget', () => {
        const samples: number[] = [];
        const onRender = (_id: string, _phase: string, actualDuration: number) => {
            samples.push(actualDuration);
        };

        const Harness = () => {
            const [value, setValue] = useState(d(2026, 5, 8));
            return (
                <NoriProvider locale="en-US">
                    <Profiler id="calendar" onRender={onRender}>
                        <Calendar value={value} onChange={(v) => v && setValue(v as CalendarDate)} />
                    </Profiler>
                </NoriProvider>
            );
        };

        const { getByLabelText } = render(<Harness />);
        samples.length = 0;

        act(() => {
            fireEvent.press(getByLabelText(/next month/i));
        });

        expect(samples.length).toBeGreaterThan(0);
        const max = Math.max(...samples);
        if (max > BUDGET_MS) {
            // eslint-disable-next-line no-console
            console.error(`Calendar paged month-change commit took ${max.toFixed(2)}ms (budget ${BUDGET_MS}ms)`);
        }
        expect(max).toBeLessThan(BUDGET_MS);
    });
});
