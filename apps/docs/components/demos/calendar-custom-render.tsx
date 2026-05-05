import { Calendar } from '@nori-ui/core';

export default function CalendarCustomRender() {
    return (
        <Calendar
            renderDay={(ctx) => (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: 12 }}>{ctx.date.day}</span>
                    {ctx.isWeekend ? <span style={{ fontSize: 8, color: '#999' }}>•</span> : null}
                </div>
            )}
        />
    );
}
