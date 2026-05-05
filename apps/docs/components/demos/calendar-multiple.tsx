import type { CalendarDate } from '@internationalized/date';
import { Calendar } from '@nori-ui/core';
import { useState } from 'react';

export default function CalendarMultiple() {
    const [dates, setDates] = useState<CalendarDate[]>([]);
    return <Calendar mode="multiple" value={dates} onChange={(v) => setDates(v)} />;
}
