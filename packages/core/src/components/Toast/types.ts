import type { ReactNode } from 'react';

export type ToastTone = 'default' | 'info' | 'success' | 'warning' | 'danger';

export type ToasterPosition =
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';

export type ToastAction = {
    /** Visible button label. */
    label: string;
    /** Click handler. */
    onClick: () => void;
};

/**
 * Options accepted by `toast(...)` and the per-tone shortcuts. Mirrors
 * sonner's options with one renaming for cross-platform clarity:
 * `description` is the body line under the title, `action` and `cancel`
 * are buttons rendered inline.
 */
export type ToastOptions = {
    /** Body line below the title. */
    description?: string;
    /**
     * Auto-dismiss after this many milliseconds. Pass `Infinity` (or a
     * negative number) to keep the toast open until manually dismissed.
     * @defaultValue 4000
     */
    duration?: number;
    /** Inline action button (typically "Undo"). */
    action?: ToastAction;
    /** Inline cancel button. */
    cancel?: ToastAction;
    /**
     * Visible severity tone. Drives the icon and accent. Library
     * convenience helpers (`toast.success`, etc.) set this for you.
     * @defaultValue 'default'
     */
    tone?: ToastTone;
    /** Stable id — useful for updating an existing toast or dismissing it. */
    id?: string | number;
    /** Override the global `<Toaster position>` for this toast only. */
    position?: ToasterPosition;
    /** Custom icon override. Applied to all platforms. */
    icon?: ReactNode;
    /** Optional className for the toast surface (web only — native ignores). */
    className?: string;
};

/** Internal — what the native store keeps per active toast. */
export type ActiveToast = ToastOptions & {
    id: string | number;
    title: ReactNode;
    /** Wallclock at insertion — used by the native auto-dismiss timer. */
    insertedAt: number;
};

export type ToasterProps = {
    /** Where the toast stack anchors. @defaultValue 'top-center' */
    position?: ToasterPosition;
    /**
     * Maximum number of toasts visible at once. Older toasts collapse
     * behind newer ones (web) or pop off the top of the stack (native).
     * @defaultValue 3
     */
    visibleToasts?: number;
    /** Spacing between stacked toasts in px. @defaultValue 14 */
    gap?: number;
    /**
     * Pad the toaster away from the viewport edges by this many px.
     * @defaultValue 24
     */
    offset?: number;
    /**
     * Show a small close button in the top-right corner of each toast.
     * @defaultValue false
     */
    closeButton?: boolean;
    /**
     * Web only: full-color toasts per tone (sonner's `richColors`). On
     * native this is honored visually too, with the same palette recipe.
     * @defaultValue false
     */
    richColors?: boolean;
    /**
     * Web only: expand the stack on hover (sonner's `expand`). Native
     * always renders the visible toasts uncollapsed, so this is a no-op
     * there.
     * @defaultValue false
     */
    expand?: boolean;
    /** Default duration in ms for toasts that don't pass their own. @defaultValue 4000 */
    duration?: number;
};
