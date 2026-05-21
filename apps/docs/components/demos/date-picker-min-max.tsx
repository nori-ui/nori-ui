'use client';

import { CalendarDate } from '@internationalized/date';
import { DatePicker } from '@nori-ui/core';
import { useState } from 'react';

export default function DatePickerMinMaxDemo() {
    const [d, setD] = useState<CalendarDate | null>(null);
    return (
        <DatePicker
            value={d}
            onChange={setD}
            minValue={new CalendarDate(2026, 5, 1)}
            maxValue={new CalendarDate(2026, 5, 31)}
            placeholder="May 2026 only"
        />
    );
}
