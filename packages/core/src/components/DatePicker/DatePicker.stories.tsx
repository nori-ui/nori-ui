import { CalendarDate } from '@internationalized/date';
import { useState } from 'react';
import { Field } from '../Field';
import { DatePicker } from './DatePicker';

export default { title: 'Components/DatePicker' };

export const Basic = () => {
    const [d, setD] = useState<CalendarDate | null>(null);
    return <DatePicker value={d} onChange={setD} placeholder="Pick a date" />;
};

export const WithDefault = () => {
    const [d, setD] = useState<CalendarDate | null>(new CalendarDate(2026, 5, 21));
    return <DatePicker value={d} onChange={setD} />;
};

export const Disabled = () => <DatePicker disabled placeholder="Disabled" />;

export const WithMinMax = () => {
    const [d, setD] = useState<CalendarDate | null>(null);
    return (
        <DatePicker
            value={d}
            onChange={setD}
            minValue={new CalendarDate(2026, 5, 1)}
            maxValue={new CalendarDate(2026, 5, 31)}
            placeholder="May 2026 only"
        />
    );
};

export const RangeBasic = () => {
    const [r, setR] = useState({ start: null as CalendarDate | null, end: null as CalendarDate | null });
    return <DatePicker.Range value={r} onChange={setR} placeholder="Pick a range" />;
};

export const RangeWithMinMax = () => {
    const [r, setR] = useState({ start: null as CalendarDate | null, end: null as CalendarDate | null });
    return (
        <DatePicker.Range
            value={r}
            onChange={setR}
            minValue={new CalendarDate(2026, 5, 1)}
            maxValue={new CalendarDate(2026, 6, 30)}
            placeholder="May–Jun 2026"
        />
    );
};

export const InsideField = () => {
    const [d, setD] = useState<CalendarDate | null>(null);
    return (
        <Field label="Date of birth" description="We use this to wish you a happy birthday." required>
            <DatePicker value={d} onChange={setD} placeholder="MM/DD/YYYY" />
        </Field>
    );
};

export const InsideFieldRange = () => {
    const [r, setR] = useState({ start: null as CalendarDate | null, end: null as CalendarDate | null });
    return (
        <Field label="Vacation dates" description="When are you out of office?">
            <DatePicker.Range value={r} onChange={setR} />
        </Field>
    );
};
