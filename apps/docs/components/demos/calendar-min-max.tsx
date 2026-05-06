import { type CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
import { Calendar } from '@nori-ui/core';
import { useState } from 'react';

/** Constrains selection to a 30-day window starting today. */
export default function CalendarMinMax() {
    const [value, setValue] = useState<CalendarDate | null>(null);
    const start = today(getLocalTimeZone());
    const end = start.add({ days: 30 });
    return <Calendar value={value} onChange={(v) => setValue(v)} minValue={start} maxValue={end} />;
}
