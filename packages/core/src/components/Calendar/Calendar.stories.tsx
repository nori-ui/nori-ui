import { CalendarDate } from '@internationalized/date';
import type { Meta, StoryObj } from '@storybook/react';
import { Calendar } from './Calendar';

const meta: Meta<typeof Calendar> = {
    title: 'Data Entry/Calendar',
    component: Calendar,
    parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Calendar>;

const today = new CalendarDate(2026, 5, 15);

export const Basic: Story = {
    args: { defaultValue: today, locale: 'en-US' },
};

export const Range: Story = {
    args: { mode: 'range', locale: 'en-US', visibleMonths: 2 },
};

export const Multiple: Story = {
    args: {
        mode: 'multiple',
        defaultValue: [today, today.add({ days: 3 })],
        locale: 'en-US',
    },
};

export const German: Story = {
    args: { defaultValue: today, locale: 'de-DE' },
};

export const ArabicRTL: Story = {
    args: { defaultValue: today, locale: 'ar-SA' },
};

export const WithMinMax: Story = {
    args: {
        defaultValue: today,
        minValue: today.subtract({ days: 5 }),
        maxValue: today.add({ days: 14 }),
        locale: 'en-US',
    },
};
