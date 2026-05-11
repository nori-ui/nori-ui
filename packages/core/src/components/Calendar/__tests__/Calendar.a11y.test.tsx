import { CalendarDate } from '@internationalized/date';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Calendar } from '../Calendar';

expect.extend(toHaveNoViolations);

const d = (y: number, m: number, day: number) => new CalendarDate(y, m, day);

describe('<Calendar /> a11y', () => {
    it('has no axe violations in single mode', async () => {
        const { container } = render(<Calendar defaultValue={d(2026, 5, 15)} locale="en-US" />);
        // color-contrast is disabled: jsdom does not compute CSS-in-JS / inline colors reliably,
        // so contrast checks always flag false positives in this environment.
        const results = await axe(container, { rules: { 'color-contrast': { enabled: false } } });
        expect(results).toHaveNoViolations();
    });

    it('has no axe violations in range mode', async () => {
        const { container } = render(<Calendar mode="range" locale="en-US" />);
        // color-contrast is disabled: jsdom does not compute CSS-in-JS / inline colors reliably,
        // so contrast checks always flag false positives in this environment.
        const results = await axe(container, { rules: { 'color-contrast': { enabled: false } } });
        expect(results).toHaveNoViolations();
    });

    it('header buttons have accessible names', () => {
        const { getByLabelText } = render(<Calendar defaultValue={d(2026, 5, 15)} locale="en-US" />);
        expect(getByLabelText('Previous month')).toBeInTheDocument();
        expect(getByLabelText('Next month')).toBeInTheDocument();
    });
});
