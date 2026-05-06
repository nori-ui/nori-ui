import type { CalendarDate } from '@internationalized/date';
import { Calendar } from '@nori-ui/core';
import { useState } from 'react';

/**
 * `caption="dropdown"` swaps the centered title button for two
 * `Select` pills — one for the month, one for the year. The drilldown
 * to month/year views is replaced; the dropdowns ARE the navigation.
 */
export default function CalendarDropdownCaption() {
    const [value, setValue] = useState<CalendarDate | null>(null);
    return <Calendar value={value} onChange={(v) => setValue(v)} caption="dropdown" yearRange={[2020, 2030]} />;
}
