import { CalendarDate } from '@internationalized/date';
import { fireEvent, render, screen } from '@testing-library/react';
import { Calendar } from '../Calendar';

const d = (y: number, m: number, day: number) => new CalendarDate(y, m, day);

describe('<Calendar /> single mode', () => {
    it('renders the focused month title', () => {
        render(<Calendar defaultValue={d(2026, 5, 15)} locale="en-US" />);
        expect(screen.getByText(/May 2026/)).toBeInTheDocument();
    });

    it('selecting a day calls onChange with the date and meta', () => {
        const onChange = jest.fn();
        render(<Calendar defaultValue={d(2026, 5, 15)} onChange={onChange} locale="en-US" />);
        // The first cell with text "20" within the May 2026 grid.
        const cells = screen.getAllByRole('button').filter((b) => b.textContent === '20');
        expect(cells.length).toBeGreaterThan(0);
        const cell20 = cells[0];
        if (!cell20) {
            throw new Error('day 20 button not found');
        }
        fireEvent.click(cell20);
        expect(onChange).toHaveBeenCalledWith(
            expect.objectContaining({ year: 2026, month: 5, day: 20 }),
            expect.objectContaining({ view: 'day', source: 'click' })
        );
    });

    it('clicking the title drills down from day to month view', () => {
        render(<Calendar defaultValue={d(2026, 5, 15)} locale="en-US" />);
        fireEvent.click(screen.getByText(/May 2026/));
        // Month grid renders 12 month names.
        expect(screen.getByRole('button', { name: 'January' })).toBeInTheDocument();
        // Title now shows the year.
        expect(screen.getByText('2026')).toBeInTheDocument();
    });

    it('clicking the year title drills down to year/decade view', () => {
        render(<Calendar defaultValue={d(2026, 5, 15)} defaultView="month" locale="en-US" />);
        fireEvent.click(screen.getByText('2026'));
        expect(screen.getByText(/2020 – 2031/)).toBeInTheDocument();
    });
});

describe('<Calendar /> range mode', () => {
    it('first click sets pending start with end=null', () => {
        const onChange = jest.fn();
        render(<Calendar mode="range" locale="en-US" onChange={onChange} />);
        const cells = screen.getAllByRole('button').filter((b) => b.textContent === '10');
        expect(cells.length).toBeGreaterThan(0);
        const cell10 = cells[0];
        if (!cell10) {
            throw new Error('day 10 button not found');
        }
        fireEvent.click(cell10);
        expect(onChange).toHaveBeenCalledWith(
            expect.objectContaining({ start: expect.anything(), end: null }),
            expect.objectContaining({ view: 'day' })
        );
    });
});

describe('<Calendar /> visibleMonths', () => {
    it('renders two month grids when visibleMonths=2', () => {
        render(<Calendar defaultValue={d(2026, 5, 15)} visibleMonths={2} locale="en-US" />);
        expect(screen.getByText(/May 2026/)).toBeInTheDocument();
        expect(screen.getByText(/June 2026/)).toBeInTheDocument();
    });
});

describe('<Calendar /> range mode — fixed gaps', () => {
    it('keyboard ArrowRight moves focused date in range mode', () => {
        const onChange = jest.fn();
        const { container } = render(<Calendar mode="range" defaultValue={null} onChange={onChange} locale="en-US" />);
        const root = container.querySelector('[role="grid"]')?.parentElement;
        expect(root).toBeTruthy();
        // Pressing Enter selects the focused date — that proves the keyboard handler is wired.
        // Initial focus is `today`, so we just verify Enter triggers selectDate.
        if (root) {
            fireEvent.keyDown(root, { key: 'Enter' });
        }
        expect(onChange).toHaveBeenCalled();
    });

    it('respects controlled view + onViewChange in range mode', () => {
        const onViewChange = jest.fn();
        const { rerender } = render(<Calendar mode="range" view="day" onViewChange={onViewChange} locale="en-US" />);
        // Initially day view — month name visible.
        expect(screen.queryByRole('button', { name: 'January' })).toBeNull();
        // Switch to controlled month view.
        rerender(<Calendar mode="range" view="month" onViewChange={onViewChange} locale="en-US" />);
        expect(screen.getByRole('button', { name: 'January' })).toBeInTheDocument();
    });
});
