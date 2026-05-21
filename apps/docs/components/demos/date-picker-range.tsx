'use client';

import type { CalendarDate } from '@internationalized/date';
import { DatePicker } from '@nori-ui/core';
import { useState } from 'react';

export default function DatePickerRangeDemo() {
    const [r, setR] = useState<{ start: CalendarDate | null; end: CalendarDate | null }>({
        start: null,
        end: null,
    });
    return <DatePicker.Range value={r} onChange={setR} placeholder="Pick a range" />;
}
