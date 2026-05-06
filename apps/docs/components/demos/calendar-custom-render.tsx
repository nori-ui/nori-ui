import type { CalendarDate } from '@internationalized/date';
import { Calendar, Text, useThemeColors, VStack } from '@nori-ui/core/client';
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
    const colors = useThemeColors();
    return (
        <Calendar
            value={value}
            onChange={(v) => setValue(v)}
            renderDay={(ctx) => {
                const isPrimary = ctx.isSelected || ctx.isRangeStart || ctx.isRangeEnd;
                // Text auto-themes via useThemeColors; we override color only
                // when the cell sits on the primary fill (selected/range
                // endpoints) so the number stays readable on both schemes.
                const dayColor = isPrimary ? colors.semantic.text.inverted : undefined;
                const priceColor = isPrimary ? colors.semantic.text.inverted : colors.semantic.text.muted;
                return (
                    <VStack className="h-full w-full items-center justify-center" gap={0}>
                        <Text
                            style={{
                                fontSize: 13,
                                fontWeight: ctx.isToday ? '600' : '400',
                                opacity: ctx.isOutsideMonth ? 0.55 : 1,
                                ...(dayColor ? { color: dayColor } : {}),
                            }}
                        >
                            {String(ctx.date.day)}
                        </Text>
                        {ctx.isOutsideMonth ? null : (
                            <Text style={{ fontSize: 9, color: priceColor }}>{`$${priceFor(ctx.date)}`}</Text>
                        )}
                    </VStack>
                );
            }}
        />
    );
}
