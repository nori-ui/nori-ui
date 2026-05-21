// Re-export the compound + runtime values from the platform entry-point.
export { Drawer, Sheet, SheetPanel } from './Sheet';

// Re-export all subcomponents and types from the shared module — these are
// identical across platforms and do not require platform-extension resolution.
export {
    SheetBody,
    type SheetBodyProps,
    SheetClose,
    type SheetCloseProps,
    SheetDescription,
    type SheetDescriptionProps,
    SheetFooter,
    type SheetFooterProps,
    SheetHeader,
    type SheetHeaderProps,
    type SheetPanelProps,
    type SheetProps,
    type SheetSide,
    type SheetSize,
    SheetTitle,
    type SheetTitleProps,
    SheetTrigger,
    type SheetTriggerProps,
} from './Sheet.shared';
