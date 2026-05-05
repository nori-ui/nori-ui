import { CalendarDate } from '@internationalized/date';
import { Calendar, Text, VStack } from '@nori-ui/core';
import { useState } from 'react';

export default function CalendarControlled() {
    const [value, setValue] = useState<CalendarDate | null>(new CalendarDate(2026, 5, 15));
    return (
        <VStack gap={3}>
            <Calendar value={value} onChange={(v) => setValue(v)} />
            <Text>Selected: {value ? value.toString() : '—'}</Text>
        </VStack>
    );
}
