import { fireEvent, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Calendar } from '../../Calendar';
import { NoriProvider } from '../../../../provider';

/**
 * Native range tap-tap verification.
 *
 * Phase 1 wired hover-preview via Pressable.onHoverIn, which is platform-aware
 * (RN-Web only). On native, onHoverIn never fires, so:
 *   - setHoveredDate is never called from DayCell
 *   - hoveredDate stays null
 *   - previewRange is null
 *
 * Tap-tap range behavior therefore emerges *automatically* from the existing
 * range state machine. This file verifies that's true and acts as a regression
 * guard against accidental re-introduction of a hover code path on native.
 *
 * Path-A note (selected detection):
 *   DayCell currently sets accessibilityState={{ disabled }} only — `selected`
 *   is intentionally NOT exposed via accessibilityState (reverted to avoid an
 *   axe violation on jsdom). The selected state is surfaced through the
 *   accessibility label suffix (", selected"). Tests below assert via label.
 */
const wrap = (ui: ReactNode) => <NoriProvider locale="en-US">{ui}</NoriProvider>;

describe('Calendar — native range tap-tap', () => {
    it('first tap sets pending start, second tap commits end', () => {
        const onChange = jest.fn();
        const { getByLabelText } = render(
            wrap(<Calendar mode="range" defaultValue={null} onChange={onChange} />)
        );

        fireEvent.press(getByLabelText(/May 10,\s+2026/i));
        expect(onChange).toHaveBeenCalledTimes(1);
        let lastVal = onChange.mock.calls[0]?.[0];
        expect(lastVal).toMatchObject({
            start: { year: 2026, month: 5, day: 10 },
            end: null,
        });

        fireEvent.press(getByLabelText(/May 15,\s+2026/i));
        expect(onChange).toHaveBeenCalledTimes(2);
        lastVal = onChange.mock.calls[1]?.[0];
        expect(lastVal).toMatchObject({
            start: { year: 2026, month: 5, day: 10 },
            end: { year: 2026, month: 5, day: 15 },
        });
    });

    it('third tap restarts the pending state', () => {
        const onChange = jest.fn();
        const { getByLabelText } = render(
            wrap(<Calendar mode="range" defaultValue={null} onChange={onChange} />)
        );

        fireEvent.press(getByLabelText(/May 10,\s+2026/i));
        fireEvent.press(getByLabelText(/May 15,\s+2026/i));
        fireEvent.press(getByLabelText(/May 20,\s+2026/i));

        const lastVal = onChange.mock.calls[2]?.[0];
        expect(lastVal).toMatchObject({
            start: { year: 2026, month: 5, day: 20 },
            end: null,
        });
    });

    it('never paints a preview range on native (no hover path active)', () => {
        // Regression guard for the dropped-interaction-split design:
        // after a single tap, exactly ONE cell should advertise "selected"
        // (the pending start). If hover-preview were somehow firing on native,
        // multiple cells would carry the "selected" suffix because previewRange
        // would mark range start/end and isInRange cells.
        const { getByLabelText, queryAllByLabelText } = render(
            wrap(<Calendar mode="range" defaultValue={null} />)
        );

        fireEvent.press(getByLabelText(/May 10,\s+2026/i));

        // The label suffix is ", selected" — match it specifically so we don't
        // false-match on words like "Wednesday" or month names.
        const selected = queryAllByLabelText(/,\s*selected\b/i);
        expect(selected).toHaveLength(1);
    });
});
