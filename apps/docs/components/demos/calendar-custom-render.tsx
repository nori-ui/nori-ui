import type { CalendarDate } from '@internationalized/date';
import { Calendar } from '@nori-ui/core';
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
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            height: '100%',
                            lineHeight: 1,
                            gap: 2,
                        }}
                    >
                        <span
                            style={{
                                fontSize: 13,
                                fontWeight: ctx.isToday ? 600 : 400,
                                color: isPrimary ? '#fff' : ctx.isOutsideMonth ? '#a1a1aa' : '#18181b',
                            }}
                        >
                            {ctx.date.day}
                        </span>
                        {ctx.isOutsideMonth ? null : (
                            <span
                                style={{
                                    fontSize: 9,
                                    fontVariantNumeric: 'tabular-nums',
                                    color: isPrimary ? 'rgba(255,255,255,0.85)' : '#71717a',
                                }}
                            >
                                {`$${priceFor(ctx.date)}`}
                            </span>
                        )}
                    </div>
                );
            }}
        />
    );
}
