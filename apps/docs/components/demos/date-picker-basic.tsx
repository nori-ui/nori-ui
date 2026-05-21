'use client';

import type { CalendarDate } from '@internationalized/date';
import { DatePicker } from '@nori-ui/core';
import { useState } from 'react';

export default function DatePickerBasicDemo() {
    const [d, setD] = useState<CalendarDate | null>(null);
    return <DatePicker value={d} onChange={setD} placeholder="Pick a date" />;
}
