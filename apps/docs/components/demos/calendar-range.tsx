import type { DateRange } from '@nori-ui/core';
import { Calendar } from '@nori-ui/core';
import { useState } from 'react';

export default function CalendarRange() {
    const [range, setRange] = useState<DateRange | null>(null);
    return <Calendar mode="range" value={range} onChange={(v) => setRange(v)} visibleMonths={2} />;
}
