import { CalendarDate } from '@internationalized/date';
import { act, fireEvent, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { NoriProvider } from '../../../../provider';
import { DatePicker } from '../../DatePicker';

const wrap = (ui: ReactNode) => <NoriProvider locale="en-US">{ui}</NoriProvider>;
const d = (y: number, m: number, day: number) => new CalendarDate(y, m, day);

// ---------------------------------------------------------------------------
// Note on native test queries
//
// The Popover wraps calendar content in a Modal with a transparent backdrop
// Pressable that has aria-hidden={true}. In jest-expo (real RN renderer),
// accessibilityElementsHidden={true} causes RNTL to exclude that subtree
// from accessibility-based queries.
//
// Solutions:
//   - Use { includeHiddenElements: true } to find text/nodes inside the Modal
//   - Use toHaveAccessibilityState({ expanded }) on the trigger to verify open state
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 1. DatePicker renders with placeholder
// ---------------------------------------------------------------------------
describe('DatePicker — native smoke', () => {
    it('renders placeholder text when no value is set', () => {
        const { getByText } = render(wrap(<DatePicker placeholder="Pick a date" />));
        expect(getByText('Pick a date')).toBeTruthy();
    });

    it('renders formatted value when value is provided', () => {
        const { getByText } = render(wrap(<DatePicker value={d(2026, 1, 15)} locale="en-US" />));
        expect(getByText(/Jan 15, 2026/i)).toBeTruthy();
    });
});

// ---------------------------------------------------------------------------
// 2. Pressing trigger opens popover (Calendar visible)
//
// The Popover wraps content in a Modal + backdrop Pressable with aria-hidden.
// On native (jest-expo), accessibilityElementsHidden hides that subtree from
// default RNTL queries. We use { includeHiddenElements: true } to reach the
// calendar text, and toHaveAccessibilityState to verify expanded state.
// ---------------------------------------------------------------------------
describe('DatePicker — native open', () => {
    it('pressing the trigger shows the calendar (aria-expanded + month text)', () => {
        const { getByRole, queryAllByText } = render(
            wrap(<DatePicker defaultValue={d(2026, 5, 1)} locale="en-US" placeholder="Pick" />)
        );

        const trigger = getByRole('combobox');

        // Before press: not expanded
        expect(trigger).toHaveAccessibilityState({ expanded: false });
        expect(queryAllByText(/May 2026/i, { includeHiddenElements: true })).toHaveLength(0);

        act(() => {
            fireEvent.press(trigger);
        });

        // After press: expanded, calendar month header visible inside Modal
        expect(trigger).toHaveAccessibilityState({ expanded: true });
        expect(queryAllByText(/May 2026/i, { includeHiddenElements: true }).length).toBeGreaterThan(0);
    });

    it('selecting a date closes the popover and fires onChange', () => {
        const onChange = jest.fn();
        const { getByRole, queryAllByText } = render(
            wrap(<DatePicker defaultValue={d(2026, 5, 1)} onChange={onChange} locale="en-US" />)
        );

        const trigger = getByRole('combobox');
        act(() => {
            fireEvent.press(trigger);
        });

        // Calendar is open
        expect(trigger).toHaveAccessibilityState({ expanded: true });

        // Find and press day 15 (inside the aria-hidden Modal)
        const day15 = queryAllByText('15', { includeHiddenElements: true })[0];
        expect(day15).toBeTruthy();

        act(() => {
            // biome-ignore lint/style/noNonNullAssertion: guarded by expect().toBeTruthy() two lines above
            fireEvent.press(day15!);
        });

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ day: 15 }));

        // After selection, popover closes — trigger is no longer expanded
        expect(trigger).toHaveAccessibilityState({ expanded: false });
    });
});

// ---------------------------------------------------------------------------
// 3. Range mode renders combined display
// ---------------------------------------------------------------------------
describe('DatePicker.Range — native smoke', () => {
    it('renders placeholder when no range is set', () => {
        const { getByText } = render(
            wrap(<DatePicker.Range value={{ start: null, end: null }} placeholder="Pick a range" />)
        );
        expect(getByText('Pick a range')).toBeTruthy();
    });

    it('renders combined date range display when both dates are set', () => {
        const { getByText } = render(
            wrap(<DatePicker.Range value={{ start: d(2026, 1, 1), end: d(2026, 1, 5) }} locale="en-US" />)
        );
        expect(getByText(/Jan 1, 2026\s*–\s*Jan 5, 2026/i)).toBeTruthy();
    });

    it('opens Calendar in range mode on press (aria-expanded + month text)', () => {
        const { getByRole, queryAllByText } = render(
            wrap(
                <DatePicker.Range
                    defaultValue={{ start: d(2026, 5, 1), end: null }}
                    locale="en-US"
                    placeholder="Pick range"
                />
            )
        );

        const trigger = getByRole('combobox');

        // Not expanded before press
        expect(trigger).toHaveAccessibilityState({ expanded: false });

        act(() => {
            fireEvent.press(trigger);
        });

        // Expanded and calendar month header visible
        expect(trigger).toHaveAccessibilityState({ expanded: true });
        expect(queryAllByText(/May 2026/i, { includeHiddenElements: true }).length).toBeGreaterThan(0);
    });
});
