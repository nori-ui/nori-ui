import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SegmentedControl } from './SegmentedControl';

const meta: Meta<typeof SegmentedControl> = {
    title: 'Controls/SegmentedControl',
    component: SegmentedControl,
};
export default meta;
type Story = StoryObj<typeof SegmentedControl>;

function DateRange() {
    const [range, setRange] = useState<'day' | 'week' | 'month'>('week');
    return (
        <SegmentedControl
            value={range}
            onChange={setRange}
            options={[
                { value: 'day', label: 'Day' },
                { value: 'week', label: 'Week' },
                { value: 'month', label: 'Month' },
            ]}
        />
    );
}

export const Basic: Story = { render: () => <DateRange /> };
