import type { CalendarDate } from '@internationalized/date';
import { Calendar } from '@nori-ui/core';
import { useState } from 'react';

export default function CalendarBasic() {
    const [value, setValue] = useState<CalendarDate | null>(null);
    return <Calendar value={value} onChange={(v) => setValue(v)} />;
}
