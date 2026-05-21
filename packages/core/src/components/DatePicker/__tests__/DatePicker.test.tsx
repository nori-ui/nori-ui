import { CalendarDate } from '@internationalized/date';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { DatePicker } from '../DatePicker';

// Web tests run without NoriProvider — DatePicker falls back to en-US via detectLocale().
// Wrap in a minimal locale provider if needed; for now the fallback suffices.

const wrap = (ui: ReactNode) => ui;

const d = (y: number, m: number, day: number) => new CalendarDate(y, m, day);

// ---------------------------------------------------------------------------
// 1. DatePicker renders trigger with placeholder when no value
// ---------------------------------------------------------------------------
describe('DatePicker — no value', () => {
    it('renders placeholder when no value is provided', () => {
        render(wrap(<DatePicker placeholder="Pick a date" />));
        expect(screen.getByText('Pick a date')).toBeInTheDocument();
    });
});

// ---------------------------------------------------------------------------
// 2. DatePicker renders formatted value when value is provided
// ---------------------------------------------------------------------------
describe('DatePicker — with value', () => {
    it('renders the formatted date string when a value is set', () => {
        render(wrap(<DatePicker value={d(2026, 1, 15)} locale="en-US" />));
        // Intl.DateTimeFormat(en-US, {dateStyle:'medium'}) → "Jan 15, 2026"
        expect(screen.getByText(/Jan 15, 2026/i)).toBeInTheDocument();
    });
});

// ---------------------------------------------------------------------------
// 3. Clicking trigger opens the Popover (Calendar visible)
// ---------------------------------------------------------------------------
describe('DatePicker — open popover', () => {
    it('clicking the trigger renders the calendar', () => {
        render(wrap(<DatePicker defaultValue={d(2026, 5, 1)} locale="en-US" placeholder="Pick" />));
        // Before click — calendar should not be visible
        expect(screen.queryByRole('dialog')).toBeNull();

        const trigger = screen.getByRole('combobox');
        fireEvent.click(trigger);

        // Calendar renders inside the popover dialog
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
});

// ---------------------------------------------------------------------------
// 4. Selecting a date fires onChange + closes the popover
// ---------------------------------------------------------------------------
describe('DatePicker — select date', () => {
    it('fires onChange with selected date and closes the popover', () => {
        const onChange = jest.fn();
        render(wrap(<DatePicker defaultValue={d(2026, 5, 1)} onChange={onChange} locale="en-US" />));

        const trigger = screen.getByRole('combobox');
        fireEvent.click(trigger);
        expect(screen.getByRole('dialog')).toBeInTheDocument();

        // Click day "20" in the calendar
        const dayCells = screen.getAllByRole('button').filter((b) => b.textContent === '20');
        expect(dayCells.length).toBeGreaterThan(0);
        fireEvent.click(dayCells[0] as HTMLElement);

        expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ day: 20 }));
        // Popover should have closed
        expect(screen.queryByRole('dialog')).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 5. disabled blocks the trigger
// ---------------------------------------------------------------------------
describe('DatePicker — disabled', () => {
    it('does not open when disabled', () => {
        render(wrap(<DatePicker disabled placeholder="Disabled" />));
        const trigger = screen.getByRole('combobox');
        // aria-disabled should be present
        expect(trigger).toHaveAttribute('aria-disabled', 'true');
        // Clicking should not open the popover
        fireEvent.click(trigger);
        expect(screen.queryByRole('dialog')).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 6. aria-invalid is forwarded onto the trigger
// ---------------------------------------------------------------------------
describe('DatePicker — aria forwarding', () => {
    it('forwards aria-invalid onto the trigger element', () => {
        render(wrap(<DatePicker aria-invalid={true} placeholder="invalid" />));
        const trigger = screen.getByRole('combobox');
        expect(trigger).toHaveAttribute('aria-invalid', 'true');
    });
});

// ---------------------------------------------------------------------------
// 7. DatePicker.Range renders two-date format when range is complete
// ---------------------------------------------------------------------------
describe('DatePicker.Range — complete range display', () => {
    it('renders formatted start and end when range is complete', () => {
        render(wrap(<DatePicker.Range value={{ start: d(2026, 1, 1), end: d(2026, 1, 5) }} locale="en-US" />));
        // Should contain both dates separated by an en-dash
        const text = screen.getByText(/Jan 1, 2026\s*–\s*Jan 5, 2026/i);
        expect(text).toBeInTheDocument();
    });
});

// ---------------------------------------------------------------------------
// 8. DatePicker.Range partial range (start only) shows "Jan 1, 2026 – "
// ---------------------------------------------------------------------------
describe('DatePicker.Range — partial range display', () => {
    it('renders start date with trailing en-dash when end is not set', () => {
        render(wrap(<DatePicker.Range value={{ start: d(2026, 1, 1), end: null }} locale="en-US" />));
        const text = screen.getByText(/Jan 1, 2026\s*–\s*$/i);
        expect(text).toBeInTheDocument();
    });
});

// ---------------------------------------------------------------------------
// 9. Selecting end date in Range fires onChange with both dates + closes popover
// ---------------------------------------------------------------------------
describe('DatePicker.Range — select full range', () => {
    it('fires onChange with both dates and closes popover when end is selected', () => {
        const onChange = jest.fn();
        render(wrap(<DatePicker.Range defaultValue={{ start: null, end: null }} onChange={onChange} locale="en-US" />));

        const trigger = screen.getByRole('combobox');
        fireEvent.click(trigger);
        expect(screen.getByRole('dialog')).toBeInTheDocument();

        // Pick start (day 5)
        const day5Cells = screen.getAllByRole('button').filter((b) => b.textContent === '5');
        expect(day5Cells.length).toBeGreaterThan(0);
        fireEvent.click(day5Cells[0] as HTMLElement);

        // After first click (start selected, end still null), popover stays open
        expect(screen.getByRole('dialog')).toBeInTheDocument();

        // Pick end (day 10)
        const day10Cells = screen.getAllByRole('button').filter((b) => b.textContent === '10');
        expect(day10Cells.length).toBeGreaterThan(0);
        fireEvent.click(day10Cells[0] as HTMLElement);

        // Last onChange call should have both start and end
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
        expect(lastCall?.[0]).toMatchObject({
            start: expect.objectContaining({ day: 5 }),
            end: expect.objectContaining({ day: 10 }),
        });

        // Popover closes after full range selected
        expect(screen.queryByRole('dialog')).toBeNull();
    });
});
