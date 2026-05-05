import { CalendarDate } from '@internationalized/date';
import { render, screen } from '@testing-library/react';
import { Calendar } from '../Calendar';

const d = (y: number, m: number, day: number) => new CalendarDate(y, m, day);

describe('<Calendar /> i18n — title format', () => {
    it.each([
        ['en-US', /May 2026/],
        ['de-DE', /Mai 2026/],
        ['fr-FR', /mai 2026/],
        // Arabic locale uses Arabic-Indic numerals; ٢٠٢٦ is 2026 in that script.
        // The month name (مايو) is also stable, but the year numeral is the minimal cross-runtime assertion.
        ['ar-SA', /٢٠٢٦/],
        ['he-IL', /2026/],
    ])('formats title for %s', (locale, regex) => {
        const { unmount } = render(<Calendar defaultValue={d(2026, 5, 15)} locale={locale} />);
        const found = screen.queryAllByText(regex);
        expect(found.length).toBeGreaterThan(0);
        unmount();
    });
});

describe('<Calendar /> i18n — firstDayOfWeek', () => {
    it('en-US starts week on Sunday — first weekday header begins with "S"', () => {
        const { container } = render(<Calendar defaultValue={d(2026, 5, 15)} locale="en-US" visibleMonths={1} />);
        // Weekday headers are role="columnheader" inside the grid.
        const headers = container.querySelectorAll('[role="columnheader"]');
        expect(headers.length).toBe(7);
        // First column header should start with S (Sun).
        expect(headers[0]?.textContent).toMatch(/^S/);
    });

    it('de-DE starts week on Monday — first weekday header begins with "M"', () => {
        const { container } = render(<Calendar defaultValue={d(2026, 5, 15)} locale="de-DE" visibleMonths={1} />);
        const headers = container.querySelectorAll('[role="columnheader"]');
        expect(headers.length).toBe(7);
        // First cell text should start with M (Mo).
        expect(headers[0]?.textContent).toMatch(/^M/);
    });
});

describe('<Calendar /> i18n — disabled past minValue across locales', () => {
    it('disables dates before minValue in ar-SA (RTL locale)', () => {
        render(<Calendar defaultValue={d(2026, 5, 15)} minValue={d(2026, 5, 10)} locale="ar-SA" />);
        // Day 5 should be present (it's in the May grid) and disabled.
        // Find the Pressable button rendering day "5".
        const allButtons = screen.getAllByRole('button');
        const day5 = allButtons.find((b) => b.textContent === '5');
        expect(day5).toBeDefined();
        // Pressable in disabled state on web carries the `aria-disabled` attribute via react-native-web.
        expect(day5?.getAttribute('aria-disabled')).toBe('true');
    });
});
