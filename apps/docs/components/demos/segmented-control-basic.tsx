'use client';

import { SegmentedControl } from '@nori-ui/core';
import { useState } from 'react';

export default function SegmentedControlBasic() {
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
