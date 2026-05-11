import { getLocalTimeZone, today } from '@internationalized/date';
import { Calendar } from '@nori-ui/core';

/**
 * `behavior="scroll"` renders a vertically scrollable list of month
 * panels instead of paging one month at a time. Header chevrons and
 * the dropdown caption (when enabled) scroll the list to the target
 * month rather than swapping the visible panel.
 *
 * Native requires the optional peer `@marceloterreiro/flash-calendar`.
 * Web uses a native scroll container with IntersectionObserver-driven
 * focused-month tracking — no extra dependency.
 */
export default function CalendarScroll() {
    return <Calendar behavior="scroll" defaultValue={today(getLocalTimeZone())} />;
}
