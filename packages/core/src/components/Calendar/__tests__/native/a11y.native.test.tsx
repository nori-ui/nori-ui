import { CalendarDate } from '@internationalized/date';
import { render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Calendar } from '../../Calendar';
import { NoriProvider } from '../../../../provider';

const wrap = (ui: ReactNode) => <NoriProvider locale="en-US">{ui}</NoriProvider>;
const d = (y: number, m: number, day: number) => new CalendarDate(y, m, day);

describe('Calendar — native a11y', () => {
    it('day cells expose accessibilityLabel, role=button, and selected state', () => {
        const { getByLabelText } = render(wrap(<Calendar defaultValue={d(2026, 5, 8)} />));
        const cell = getByLabelText(/Friday, May 8,\s+2026.*selected/i);
        expect(cell.props.accessibilityRole).toBe('button');
        expect(cell.props.accessibilityState).toMatchObject({ selected: true });
    });

    it('disabled day cells carry disabled state', () => {
        const isPast = (date: CalendarDate) => date.compare(d(2026, 5, 5)) < 0;
        const { getByLabelText } = render(
            wrap(<Calendar defaultValue={d(2026, 5, 10)} isDateUnavailable={isPast} />)
        );
        const cell = getByLabelText(/May 1,\s+2026/i);
        expect(cell.props.accessibilityState).toMatchObject({ disabled: true });
    });

    it('previous/next chevrons expose readable labels', () => {
        const { getByLabelText } = render(wrap(<Calendar />));
        expect(getByLabelText(/previous month/i)).toBeTruthy();
        expect(getByLabelText(/next month/i)).toBeTruthy();
    });

    it('day grid container exposes role=grid', () => {
        const { UNSAFE_root } = render(wrap(<Calendar />));
        // We assert on the prop directly rather than via getByRole because
        // RNTL's role query requires `accessible={true}`, which on iOS
        // collapses the entire grid into one VoiceOver group — that would
        // be a real UX regression for a grid of focusable day cells.
        // `grid` is a valid ARIA Role (and a valid native `role` prop value)
        // but not a member of RN's legacy `AccessibilityRole` union, so we
        // use `role="grid"` on the DayGrid container.
        const gridNodes = UNSAFE_root.findAll(
            (node) => node.props?.role === 'grid'
        );
        expect(gridNodes.length).toBeGreaterThan(0);
    });
});
