import type { ComponentType } from 'react';

import type { Highlighted } from '@/lib/highlight';
import AccordionMultiple from './demos/accordion-multiple';
import AccordionSingle from './demos/accordion-single';
import AspectRatioBasic from './demos/aspect-ratio-basic';
import AlertBasic from './demos/alert-basic';
import AlertDialogDestructive from './demos/alert-dialog-destructive';
import AvatarBasic from './demos/avatar-basic';
import BadgeBasic from './demos/badge-basic';
import BoxBasic from './demos/box-basic';
import BreadcrumbBasic from './demos/breadcrumb-basic';
import BreadcrumbCollapse from './demos/breadcrumb-collapse';
import BreadcrumbCompound from './demos/breadcrumb-compound';
import BreadcrumbIcons from './demos/breadcrumb-icons';
import BreadcrumbSeparators from './demos/breadcrumb-separators';
import BreadcrumbSiblingMenu from './demos/breadcrumb-sibling-menu';
import BreadcrumbWidthCollapse from './demos/breadcrumb-width-collapse';
import ButtonBasic from './demos/button-basic';
import ButtonGroupBasic from './demos/button-group-basic';
import CalendarBasic from './demos/calendar-basic';
import CollapsibleBasic from './demos/collapsible-basic';
import CalendarControlled from './demos/calendar-controlled';
import CalendarCustomRender from './demos/calendar-custom-render';
import CalendarDisabledDates from './demos/calendar-disabled-dates';
import CalendarDrilldown from './demos/calendar-drilldown';
import CalendarDropdownCaption from './demos/calendar-dropdown-caption';
import CalendarMinMax from './demos/calendar-min-max';
import CalendarMultiple from './demos/calendar-multiple';
import CalendarRange from './demos/calendar-range';
import CalendarScroll from './demos/calendar-scroll';
import CardBasic from './demos/card-basic';
import CheckboxBasic from './demos/checkbox-basic';
import CheckboxIndeterminate from './demos/checkbox-indeterminate';
import ComboboxBasic from './demos/combobox-basic';
import DataTableBasic from './demos/data-table-basic';
import ContextMenuBasic from './demos/context-menu-basic';
import DatePickerBasic from './demos/date-picker-basic';
import DatePickerMinMax from './demos/date-picker-min-max';
import DatePickerRange from './demos/date-picker-range';
import DialogBasic from './demos/dialog-basic';
import EmptyBasic from './demos/empty-basic';
import DropdownMenuBasic from './demos/dropdown-menu-basic';
import FieldBasic from './demos/field-basic';
import FieldGroup from './demos/field-group';
import FieldWithDescriptionError from './demos/field-with-description-error';
import FloatButtonBackToTop from './demos/float-button-back-to-top';
import FloatButtonBadge from './demos/float-button-badge';
import FloatButtonBasic from './demos/float-button-basic';
import FloatButtonGroup from './demos/float-button-group';
import FloatButtonGroupBackdrop from './demos/float-button-group-backdrop';
import FloatButtonShapes from './demos/float-button-shapes';
import FloatButtonVariants from './demos/float-button-variants';
import HStackBasic from './demos/hstack-basic';
import ItemBasic from './demos/item-basic';
import HStackFlex from './demos/hstack-flex';
import IconBasic from './demos/icon-basic';
import KbdBasic from './demos/kbd-basic';
import InputGroupBoth from './demos/input-group-both';
import InputGroupPrefix from './demos/input-group-prefix';
import InputGroupSuffix from './demos/input-group-suffix';
import LabelBasic from './demos/label-basic';
import PaginationBasic from './demos/pagination-basic';
import PaginationCompact from './demos/pagination-compact';
import PaginationCompound from './demos/pagination-compound';
import PaginationCustomRender from './demos/pagination-custom-render';
import PaginationFirstLast from './demos/pagination-first-last';
import PaginationHook from './demos/pagination-hook';
import PaginationJumper from './demos/pagination-jumper';
import PaginationPageSize from './demos/pagination-page-size';
import PaginationRange from './demos/pagination-range';
import PaginationSiblings from './demos/pagination-siblings';
import PopoverBasic from './demos/popover-basic';
import PopoverForm from './demos/popover-form';
import ProgressBasic from './demos/progress-basic';
import ProgressIndeterminate from './demos/progress-indeterminate';
import ProgressTones from './demos/progress-tones';
import RadioBasic from './demos/radio-basic';
import SegmentedControlBasic from './demos/segmented-control-basic';
import SelectAsync from './demos/select-async';
import SelectBasic from './demos/select-basic';
import SelectCustomRenderer from './demos/select-custom-renderer';
import SelectLocale from './demos/select-locale';
import SelectMulti from './demos/select-multi';
import SelectMultiCapped from './demos/select-multi-capped';
import SelectVirtualized from './demos/select-virtualized';
import SeparatorBasic from './demos/separator-basic';
import TableBasic from './demos/table-basic';
import SeparatorVertical from './demos/separator-vertical';
import SheetBasic from './demos/sheet-basic';
import SheetSidePanel from './demos/sheet-side-panel';
import SkeletonBasic from './demos/skeleton-basic';
import SliderBasic from './demos/slider-basic';
import SliderDisabled from './demos/slider-disabled';
import SliderMulti from './demos/slider-multi';
import SliderRtl from './demos/slider-rtl';
import SliderVertical from './demos/slider-vertical';
import SpinnerBasic from './demos/spinner-basic';
import SwitchBasic from './demos/switch-basic';
import TabsBasic from './demos/tabs-basic';
import TextAreaBasic from './demos/text-area-basic';
import TextBasic from './demos/text-basic';
import TextInputBasic from './demos/text-input-basic';
import ThemingTokens from './demos/theming-tokens';
import ToastBasic from './demos/toast-basic';
import ToastPositions from './demos/toast-positions';
import ToastUpdate from './demos/toast-update';
import ToggleBasic from './demos/toggle-basic';
import ToggleGroupMultiple from './demos/toggle-group-multiple';
import ToggleGroupSingle from './demos/toggle-group-single';
import TooltipBasic from './demos/tooltip-basic';
import TooltipSides from './demos/tooltip-sides';
import VStackBasic from './demos/vstack-basic';
import { previewSources } from './preview-sources.generated';

type PreviewEntry = Highlighted & {
    Component: ComponentType;
    /** Verbatim demo source — feeds the underlying `pre.textContent` so the copy button hands back the original file. */
    raw: string;
    /**
     * Per-demo controls visibility. Default: both shown.
     * Set `dir: false` for components with no RTL behavior worth showing
     * (Box, Skeleton, Spinner, etc.). Set `locale: false` for components
     * that don't surface any localized strings — otherwise the picker
     * looks broken because flipping it changes nothing visible.
     */
    controls?: { dir?: boolean; locale?: boolean };
};

/**
 * Registry of named demos used by `<Preview name="..." />` in MDX.
 *
 * Each entry pairs the rendered component with the demo file's source —
 * both as plain text (for copying) and as syntax-highlighted HTML (for
 * display). Sources come from `preview-sources.generated.ts`, produced by
 * `scripts/generate-preview-sources.mjs` at predev/prebuild time.
 *
 * To add a demo:
 *   1. Drop a self-contained `.tsx` file into `./demos/<name>.tsx` whose
 *      default export is the demo component.
 *   2. Import the component here.
 *   3. Add an entry below; the key MUST match the file name (without `.tsx`).
 *   4. Reference it in MDX as `<Preview name="<name>" />`.
 *
 * Sources regenerate automatically on `next dev`/`next build`.
 */
// Convenience flag bundles. Pure layout / display primitives don't have
// any RTL behavior or i18n strings worth previewing — hide both controls
// so the picker doesn't look broken when flipping it changes nothing.
const NO_CHROME = { controls: { dir: false, locale: false } } as const;
// Components with text input or labels that are RTL-affected but emit no
// i18n strings of their own.
const DIR_ONLY = { controls: { dir: true, locale: false } } as const;

export const previews = {
    'accordion-single': { Component: AccordionSingle, ...previewSources['accordion-single'], ...DIR_ONLY },
    'accordion-multiple': { Component: AccordionMultiple, ...previewSources['accordion-multiple'], ...DIR_ONLY },
    'aspect-ratio-basic': { Component: AspectRatioBasic, ...previewSources['aspect-ratio-basic'], ...NO_CHROME },
    'text-basic': { Component: TextBasic, ...previewSources['text-basic'], ...NO_CHROME },
    'box-basic': { Component: BoxBasic, ...previewSources['box-basic'], ...NO_CHROME },
    'breadcrumb-basic': { Component: BreadcrumbBasic, ...previewSources['breadcrumb-basic'] },
    'breadcrumb-separators': {
        Component: BreadcrumbSeparators,
        ...previewSources['breadcrumb-separators'],
        ...NO_CHROME,
    },
    'breadcrumb-icons': { Component: BreadcrumbIcons, ...previewSources['breadcrumb-icons'], ...NO_CHROME },
    'breadcrumb-collapse': { Component: BreadcrumbCollapse, ...previewSources['breadcrumb-collapse'] },
    'breadcrumb-width-collapse': {
        Component: BreadcrumbWidthCollapse,
        ...previewSources['breadcrumb-width-collapse'],
        ...NO_CHROME,
    },
    'breadcrumb-sibling-menu': {
        Component: BreadcrumbSiblingMenu,
        ...previewSources['breadcrumb-sibling-menu'],
        ...NO_CHROME,
    },
    'breadcrumb-compound': { Component: BreadcrumbCompound, ...previewSources['breadcrumb-compound'], ...NO_CHROME },
    'hstack-basic': { Component: HStackBasic, ...previewSources['hstack-basic'], ...NO_CHROME },
    'item-basic': { Component: ItemBasic, ...previewSources['item-basic'], ...NO_CHROME },
    'hstack-flex': { Component: HStackFlex, ...previewSources['hstack-flex'], ...NO_CHROME },
    'vstack-basic': { Component: VStackBasic, ...previewSources['vstack-basic'], ...NO_CHROME },
    'segmented-control-basic': {
        Component: SegmentedControlBasic,
        ...previewSources['segmented-control-basic'],
        ...DIR_ONLY,
    },
    'select-basic': { Component: SelectBasic, ...previewSources['select-basic'] },
    'select-multi': { Component: SelectMulti, ...previewSources['select-multi'] },
    'select-multi-capped': { Component: SelectMultiCapped, ...previewSources['select-multi-capped'] },
    'select-async': { Component: SelectAsync, ...previewSources['select-async'] },
    'select-virtualized': { Component: SelectVirtualized, ...previewSources['select-virtualized'] },
    'select-custom-renderer': { Component: SelectCustomRenderer, ...previewSources['select-custom-renderer'] },
    'select-locale': { Component: SelectLocale, ...previewSources['select-locale'] },
    'progress-basic': { Component: ProgressBasic, ...previewSources['progress-basic'], ...NO_CHROME },
    'progress-indeterminate': {
        Component: ProgressIndeterminate,
        ...previewSources['progress-indeterminate'],
        ...NO_CHROME,
    },
    'progress-tones': { Component: ProgressTones, ...previewSources['progress-tones'], ...NO_CHROME },
    'separator-basic': { Component: SeparatorBasic, ...previewSources['separator-basic'], ...NO_CHROME },
    'separator-vertical': { Component: SeparatorVertical, ...previewSources['separator-vertical'], ...NO_CHROME },
    'skeleton-basic': { Component: SkeletonBasic, ...previewSources['skeleton-basic'], ...NO_CHROME },
    'slider-basic': { Component: SliderBasic, ...previewSources['slider-basic'], ...DIR_ONLY },
    'slider-vertical': { Component: SliderVertical, ...previewSources['slider-vertical'], ...NO_CHROME },
    'slider-multi': { Component: SliderMulti, ...previewSources['slider-multi'], ...DIR_ONLY },
    'slider-rtl': { Component: SliderRtl, ...previewSources['slider-rtl'], ...DIR_ONLY },
    'slider-disabled': { Component: SliderDisabled, ...previewSources['slider-disabled'], ...DIR_ONLY },
    'spinner-basic': { Component: SpinnerBasic, ...previewSources['spinner-basic'], ...NO_CHROME },
    'button-basic': { Component: ButtonBasic, ...previewSources['button-basic'] },
    'button-group-basic': { Component: ButtonGroupBasic, ...previewSources['button-group-basic'], ...NO_CHROME },
    'card-basic': { Component: CardBasic, ...previewSources['card-basic'], ...DIR_ONLY },
    'text-input-basic': { Component: TextInputBasic, ...previewSources['text-input-basic'] },
    'text-area-basic': { Component: TextAreaBasic, ...previewSources['text-area-basic'] },
    'input-group-prefix': { Component: InputGroupPrefix, ...previewSources['input-group-prefix'], ...DIR_ONLY },
    'input-group-suffix': { Component: InputGroupSuffix, ...previewSources['input-group-suffix'], ...DIR_ONLY },
    'input-group-both': { Component: InputGroupBoth, ...previewSources['input-group-both'], ...DIR_ONLY },
    'checkbox-basic': { Component: CheckboxBasic, ...previewSources['checkbox-basic'] },
    'checkbox-indeterminate': {
        Component: CheckboxIndeterminate,
        ...previewSources['checkbox-indeterminate'],
    },
    'radio-basic': { Component: RadioBasic, ...previewSources['radio-basic'] },
    'dialog-basic': { Component: DialogBasic, ...previewSources['dialog-basic'] },
    'empty-basic': { Component: EmptyBasic, ...previewSources['empty-basic'], ...NO_CHROME },
    'float-button-basic': { Component: FloatButtonBasic, ...previewSources['float-button-basic'] },
    'float-button-shapes': { Component: FloatButtonShapes, ...previewSources['float-button-shapes'] },
    'float-button-variants': { Component: FloatButtonVariants, ...previewSources['float-button-variants'] },
    'float-button-badge': { Component: FloatButtonBadge, ...previewSources['float-button-badge'] },
    'float-button-group': { Component: FloatButtonGroup, ...previewSources['float-button-group'] },
    'float-button-group-backdrop': {
        Component: FloatButtonGroupBackdrop,
        ...previewSources['float-button-group-backdrop'],
    },
    'float-button-back-to-top': {
        Component: FloatButtonBackToTop,
        ...previewSources['float-button-back-to-top'],
    },
    'switch-basic': { Component: SwitchBasic, ...previewSources['switch-basic'] },
    'tabs-basic': { Component: TabsBasic, ...previewSources['tabs-basic'], ...DIR_ONLY },
    'toast-basic': { Component: ToastBasic, ...previewSources['toast-basic'] },
    'toast-positions': { Component: ToastPositions, ...previewSources['toast-positions'] },
    'toast-update': { Component: ToastUpdate, ...previewSources['toast-update'] },
    'toggle-basic': { Component: ToggleBasic, ...previewSources['toggle-basic'], ...DIR_ONLY },
    'toggle-group-multiple': {
        Component: ToggleGroupMultiple,
        ...previewSources['toggle-group-multiple'],
        ...DIR_ONLY,
    },
    'toggle-group-single': { Component: ToggleGroupSingle, ...previewSources['toggle-group-single'], ...DIR_ONLY },
    'icon-basic': { Component: IconBasic, ...previewSources['icon-basic'], ...NO_CHROME },
    'kbd-basic': { Component: KbdBasic, ...previewSources['kbd-basic'], ...NO_CHROME },
    'pagination-basic': { Component: PaginationBasic, ...previewSources['pagination-basic'] },
    'pagination-first-last': { Component: PaginationFirstLast, ...previewSources['pagination-first-last'] },
    'pagination-compact': { Component: PaginationCompact, ...previewSources['pagination-compact'], ...NO_CHROME },
    'pagination-siblings': { Component: PaginationSiblings, ...previewSources['pagination-siblings'] },
    'pagination-range': { Component: PaginationRange, ...previewSources['pagination-range'] },
    'pagination-compound': { Component: PaginationCompound, ...previewSources['pagination-compound'] },
    'pagination-page-size': { Component: PaginationPageSize, ...previewSources['pagination-page-size'] },
    'pagination-custom-render': {
        Component: PaginationCustomRender,
        ...previewSources['pagination-custom-render'],
        ...NO_CHROME,
    },
    'pagination-hook': { Component: PaginationHook, ...previewSources['pagination-hook'], ...NO_CHROME },
    'pagination-jumper': { Component: PaginationJumper, ...previewSources['pagination-jumper'] },
    'popover-basic': { Component: PopoverBasic, ...previewSources['popover-basic'], ...DIR_ONLY },
    'popover-form': { Component: PopoverForm, ...previewSources['popover-form'], ...DIR_ONLY },
    'tooltip-basic': { Component: TooltipBasic, ...previewSources['tooltip-basic'], ...NO_CHROME },
    'tooltip-sides': { Component: TooltipSides, ...previewSources['tooltip-sides'], ...NO_CHROME },
    'theming-tokens': { Component: ThemingTokens, ...previewSources['theming-tokens'], ...NO_CHROME },
    'avatar-basic': { Component: AvatarBasic, ...previewSources['avatar-basic'], ...NO_CHROME },
    'badge-basic': { Component: BadgeBasic, ...previewSources['badge-basic'], ...NO_CHROME },
    'alert-basic': { Component: AlertBasic, ...previewSources['alert-basic'] },
    'alert-dialog-destructive': {
        Component: AlertDialogDestructive,
        ...previewSources['alert-dialog-destructive'],
    },
    'calendar-basic': { Component: CalendarBasic, ...previewSources['calendar-basic'] },
    'collapsible-basic': { Component: CollapsibleBasic, ...previewSources['collapsible-basic'], ...DIR_ONLY },
    'calendar-range': { Component: CalendarRange, ...previewSources['calendar-range'] },
    'calendar-multiple': { Component: CalendarMultiple, ...previewSources['calendar-multiple'] },
    'calendar-drilldown': { Component: CalendarDrilldown, ...previewSources['calendar-drilldown'] },
    'calendar-controlled': { Component: CalendarControlled, ...previewSources['calendar-controlled'] },
    'calendar-custom-render': { Component: CalendarCustomRender, ...previewSources['calendar-custom-render'] },
    'calendar-min-max': { Component: CalendarMinMax, ...previewSources['calendar-min-max'] },
    'calendar-disabled-dates': { Component: CalendarDisabledDates, ...previewSources['calendar-disabled-dates'] },
    'calendar-dropdown-caption': { Component: CalendarDropdownCaption, ...previewSources['calendar-dropdown-caption'] },
    'calendar-scroll': { Component: CalendarScroll, ...previewSources['calendar-scroll'] },
    'date-picker-basic': { Component: DatePickerBasic, ...previewSources['date-picker-basic'], ...DIR_ONLY },
    'date-picker-range': { Component: DatePickerRange, ...previewSources['date-picker-range'], ...DIR_ONLY },
    'date-picker-min-max': { Component: DatePickerMinMax, ...previewSources['date-picker-min-max'], ...DIR_ONLY },
    'field-basic': { Component: FieldBasic, ...previewSources['field-basic'], ...DIR_ONLY },
    'field-with-description-error': {
        Component: FieldWithDescriptionError,
        ...previewSources['field-with-description-error'],
        ...DIR_ONLY,
    },
    'field-group': { Component: FieldGroup, ...previewSources['field-group'], ...DIR_ONLY },
    'label-basic': { Component: LabelBasic, ...previewSources['label-basic'], ...DIR_ONLY },
    'dropdown-menu-basic': { Component: DropdownMenuBasic, ...previewSources['dropdown-menu-basic'], ...DIR_ONLY },
    'context-menu-basic': { Component: ContextMenuBasic, ...previewSources['context-menu-basic'], ...DIR_ONLY },
    'sheet-basic': { Component: SheetBasic, ...previewSources['sheet-basic'], ...DIR_ONLY },
    'sheet-side-panel': { Component: SheetSidePanel, ...previewSources['sheet-side-panel'], ...DIR_ONLY },
    'combobox-basic': { Component: ComboboxBasic, ...previewSources['combobox-basic'] },
    'table-basic': { Component: TableBasic, ...previewSources['table-basic'] },
    'data-table-basic': { Component: DataTableBasic, ...previewSources['data-table-basic'] },
    // Wire new entries here. If unsure: omit `controls`. The picker
    // only annoys when it changes nothing — so set `NO_CHROME` for
    // pure visual primitives, and otherwise leave it on.
} as const satisfies Record<string, PreviewEntry>;

export type PreviewName = keyof typeof previews;
