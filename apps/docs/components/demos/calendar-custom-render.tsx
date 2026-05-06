import type { CalendarDate } from '@internationalized/date';
import { Calendar, Text, VStack } from '@nori-ui/core';
import { useState } from 'react';

/**
 * Booking-style availability calendar — each day shows the price below
 * the date number. Weekends are priced higher. Demonstrates the
 * `renderDay` slot for layered visual content.
 */
const priceFor = (date: CalendarDate): number => {
    const dow = date.toDate('UTC').getUTCDay();
    const isWeekend = dow === 0 || dow === 6;
    return isWeekend ? 220 : 140;
};

export default function CalendarCustomRender() {
    const [value, setValue] = useState<CalendarDate | null>(null);
    return (
        <Calendar
            value={value}
            onChange={(v) => setValue(v)}
            renderDay={(ctx) => {
                const isPrimary = ctx.isSelected || ctx.isRangeStart || ctx.isRangeEnd;
                return (
                    <VStack className="h-full w-full items-center justify-center" gap={0}>
                        <Text
                            className={
                                isPrimary
                                    ? 'text-semantic-text-inverted'
                                    : ctx.isOutsideMonth
                                      ? 'text-semantic-text-muted'
                                      : 'text-semantic-text-default'
                            }
                            style={{ fontSize: 13, fontWeight: ctx.isToday ? '600' : '400' }}
                        >
                            {String(ctx.date.day)}
                        </Text>
                        {ctx.isOutsideMonth ? null : (
                            <Text
                                className={isPrimary ? 'text-semantic-text-inverted/85' : 'text-semantic-text-muted'}
                                style={{ fontSize: 9 }}
                            >
                                {`$${priceFor(ctx.date)}`}
                            </Text>
                        )}
                    </VStack>
                );
            }}
        />
    );
}
