import type { Dictionary } from './types';

/**
 * Default English strings used by library components.
 *
 * Key naming convention:
 *   <component>.<purpose>[_plural-form]
 *
 * Plural suffixes follow i18next: `_zero`, `_one`, `_two`, `_few`, `_many`, `_other`.
 * Interpolation uses `{{name}}` — double braces, no spaces, by convention.
 */
export const defaultDictionary: Dictionary = {
    // generic / shared
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.loading': 'Loading',
    'common.error': 'Something went wrong',
    'common.retry': 'Try again',

    // breadcrumb
    'breadcrumb.ariaLabel': 'Breadcrumb',
    'breadcrumb.expandLabel': 'Show full path',
    'breadcrumb.ellipsisLabel': 'More',
    'breadcrumb.currentPageLabel': 'Current page',
    'breadcrumb.siblingMenuLabel': 'Open sibling pages',

    // pagination
    'pagination.ariaLabel': 'Pagination',
    'pagination.previous': 'Previous page',
    'pagination.next': 'Next page',
    'pagination.first': 'First page',
    'pagination.last': 'Last page',
    'pagination.ellipsis': 'More pages',
    'pagination.currentPage': 'Page {{page}}, current page',
    'pagination.gotoPage': 'Go to page {{page}}',
    'pagination.range': 'Showing {{from}}–{{to}} of {{total}}',
    'pagination.pageOf': 'Page {{page}} of {{total}}',
    'pagination.pageSizeLabel': 'Items per page',
    'pagination.jumperLabel': 'Go to page',
    'pagination.jumperPlaceholder': '#',

    // floatButton
    'floatButton.backToTop': 'Back to top',

    // sidebar
    'sidebar.ariaLabel': 'Sidebar',

    // calendar
    'calendar.header.previous': 'Previous month',
    'calendar.header.next': 'Next month',
    'calendar.header.openMonthView': 'Open month picker',
    'calendar.header.openYearView': 'Open year picker',
    'calendar.header.openDayView': 'Open day picker',
    'calendar.today': 'Today',
    'calendar.clear': 'Clear',

    // button
    'button.loadingLabel': 'Loading',

    // input
    'input.clear': 'Clear',
    'input.passwordShow': 'Show password',
    'input.passwordHide': 'Hide password',

    // link
    'link.opensInNewTab': 'opens in a new tab',

    // numberInput
    'numberInput.increment': 'Increase value',
    'numberInput.decrement': 'Decrease value',

    // select / combobox
    'select.placeholder': 'Select…',
    'select.searchPlaceholder': 'Search…',
    'select.searchLabel': 'Search options',
    'select.noOptions': 'No options',
    'select.loading': 'Loading…',
    'select.selectedCount_one': '{{count}} selected',
    'select.selectedCount_other': '{{count}} selected',
    'select.clearAll': 'Clear all',

    // inputOtp
    'inputOtp.label': 'One-time code',
    'inputOtp.cellLabel': 'Digit {{index}} of {{total}}',

    // command
    'command.placeholder': 'Type a command or search…',
    'command.empty': 'No results found.',

    // checkbox / switch
    'checkbox.checked': 'Checked',
    'checkbox.unchecked': 'Unchecked',
    'switch.on': 'On',
    'switch.off': 'Off',

    // field
    'field.requiredIndicator': '*',
    'field.requiredLabel': 'required',

    // chip
    'chip.remove': 'Remove {{label}}',

    // stepper
    'stepper.ariaLabel': 'Progress',
    'stepper.stepLabel': 'Step {{step}} of {{total}}: {{title}}, {{status}}',
    'stepper.status.complete': 'completed',
    'stepper.status.current': 'current',
    'stepper.status.upcoming': 'upcoming',
    'stepper.status.error': 'error',

    // rating
    'rating.ariaLabel': 'Rating',
    'rating.valueLabel': '{{value}} out of {{max}} stars',
    'rating.starLabel_one': '{{count}} star',
    'rating.starLabel_other': '{{count}} stars',

    // table / dataTable
    'table.empty': 'No data',
    'dataTable.sortBy': 'Sort by {{column}}',
    'dataTable.previousShort': 'Prev',
    'dataTable.nextShort': 'Next',

    // carousel
    'carousel.label': 'Carousel',
    'carousel.previous': 'Previous slide',
    'carousel.next': 'Next slide',
    'carousel.dotsLabel': 'Slide navigation',
    'carousel.goToSlide': 'Go to slide {{index}}',

    // avatar
    'avatar.label': 'Avatar',

    // alert
    'alert.dismiss': 'Dismiss',
};
