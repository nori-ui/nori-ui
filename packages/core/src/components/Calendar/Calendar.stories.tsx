import { CalendarDate } from '@internationalized/date';
import type { Meta, StoryObj } from '@storybook/react';
import { Text, View } from 'react-native';
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

// Scroll behavior — vertically scrollable list of month panels.
// Native uses flash-calendar when installed; web uses a native scroll
// container with IntersectionObserver-driven focus tracking.
export const Scroll: Story = {
    args: { behavior: 'scroll', defaultValue: today, locale: 'en-US' },
};

// Dropdown caption — month + year are selectable via the built-in
// Select header instead of the default centered title.
export const DropdownCaption: Story = {
    args: { caption: 'dropdown', defaultValue: today, locale: 'en-US' },
};

// Custom renderDay — fully owned cell content. Receives the full
// DayContext so consumers can drive their own marker / styling logic.
export const CustomRenderDay: Story = {
    args: {
        defaultValue: today,
        locale: 'en-US',
        renderDay: (ctx) => (
            <View style={{ padding: 6, alignItems: 'center' }}>
                <Text style={{ fontWeight: ctx.isToday ? '700' : '400' }}>{String(ctx.date.day)}</Text>
            </View>
        ),
    },
};
