import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { SegmentedControl } from '../SegmentedControl';

const OPTIONS = [
    { value: 'day' as const, label: 'Day' },
    { value: 'week' as const, label: 'Week' },
    { value: 'month' as const, label: 'Month' },
];

describe('<SegmentedControl>', () => {
    it('renders every option as a radio with role="radio"', () => {
        render(<SegmentedControl defaultValue="day" options={OPTIONS} />);
        const radios = screen.getAllByRole('radio');
        expect(radios).toHaveLength(3);
    });

    it('marks defaultValue as selected', () => {
        render(<SegmentedControl defaultValue="week" options={OPTIONS} testID="seg" />);
        const week = screen.getAllByRole('radio')[1] as HTMLElement;
        expect(week.getAttribute('aria-checked')).toBe('true');
    });

    it('uncontrolled: clicking a segment selects it', () => {
        render(<SegmentedControl defaultValue="day" options={OPTIONS} />);
        const month = screen.getAllByRole('radio')[2] as HTMLElement;
        fireEvent.click(month);
        expect(month.getAttribute('aria-checked')).toBe('true');
    });

    it('controlled: respects parent value, emits onChange', () => {
        const Wrapper = () => {
            const [v, setV] = useState<'day' | 'week' | 'month'>('day');
            return (
                <>
                    <span data-testid="cur">{v}</span>
                    <SegmentedControl value={v} onChange={setV} options={OPTIONS} />
                </>
            );
        };
        render(<Wrapper />);
        const week = screen.getAllByRole('radio')[1] as HTMLElement;
        fireEvent.click(week);
        expect(screen.getByTestId('cur').textContent).toBe('week');
    });

    it('group-level disabled blocks selection changes', () => {
        const onChange = jest.fn();
        render(<SegmentedControl defaultValue="day" disabled onChange={onChange} options={OPTIONS} />);
        const week = screen.getAllByRole('radio')[1] as HTMLElement;
        fireEvent.click(week);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('arrow keys move selection (and skip disabled options)', () => {
        const opts = [
            { value: 'a' as const, label: 'A' },
            { value: 'b' as const, label: 'B', disabled: true },
            { value: 'c' as const, label: 'C' },
        ];
        render(<SegmentedControl defaultValue="a" options={opts} testID="seg" />);
        const group = screen.getByTestId('seg');
        fireEvent.keyDown(group, { key: 'ArrowRight' });
        // Should land on 'c', not the disabled 'b'.
        const c = screen.getAllByRole('radio')[2] as HTMLElement;
        expect(c.getAttribute('aria-checked')).toBe('true');
    });

    it('Home / End jump to first / last enabled option', () => {
        render(<SegmentedControl defaultValue="week" options={OPTIONS} testID="seg" />);
        const group = screen.getByTestId('seg');
        fireEvent.keyDown(group, { key: 'End' });
        expect((screen.getAllByRole('radio')[2] as HTMLElement).getAttribute('aria-checked')).toBe('true');
        fireEvent.keyDown(group, { key: 'Home' });
        expect((screen.getAllByRole('radio')[0] as HTMLElement).getAttribute('aria-checked')).toBe('true');
    });
});
