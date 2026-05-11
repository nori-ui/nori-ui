// Setup for the nori-ui:rn Jest project. Unlike jest.rn-setup.ts (which
// mocks react-native to render DOM tags for jsdom assertions), this file
// runs UNDER jest-expo, which provides a real RN test environment.
// We only mock things that:
//   1) can't load in jest (native modules, flash-calendar's RN bridge)
//   2) we don't want to exercise here (it's covered by the wrapper test)

import '@testing-library/jest-native/extend-expect';

// flash-calendar pulls in @shopify/flash-list which has a native module
// dependency. Mock the surface we use; scroll-body.native.test.tsx
// asserts the wrapper passes the right props in.
jest.mock(
    '@marceloterreiro/flash-calendar',
    () => {
        const React = require('react');
        const { View, Text } = require('react-native');

        type Props = {
            calendarInitialMonthId?: string;
            calendarPastScrollRangeInMonths?: number;
            calendarFutureScrollRangeInMonths?: number;
            onCalendarDayPress?: (id: string) => void;
            getCalendarWeekDayFormat?: (date: Date) => string;
            children?: React.ReactNode;
        };

        const CalendarList = (props: Props) => {
            return React.createElement(
                View,
                { testID: 'flash-calendar-mock' },
                React.createElement(Text, null, `initial=${props.calendarInitialMonthId ?? ''}`),
                React.createElement(Text, null, `past=${props.calendarPastScrollRangeInMonths ?? 0}`),
                React.createElement(Text, null, `future=${props.calendarFutureScrollRangeInMonths ?? 0}`),
                props.children ?? null
            );
        };

        return { __esModule: true, Calendar: { List: CalendarList } };
    },
    // flash-calendar is added as an optional peer dep in T12; mark virtual so jest
    // doesn't try to resolve the module at setup time.
    { virtual: true }
);
