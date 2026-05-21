'use client';

import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// HoverCard — native stub
//
// HoverCard is web-only. On native, hover events do not exist, so we render
// only the trigger child. HoverCard.Content is a no-op that renders nothing.
//
// Long-press to reveal rich content is a distinct UX pattern; use Popover
// directly if you need it on native.
// ---------------------------------------------------------------------------

export type HoverCardProps = {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    openDelay?: number;
    closeDelay?: number;
    children?: ReactNode;
};

const HoverCardRoot = ({ children }: HoverCardProps) => <>{children}</>;

export type HoverCardTriggerProps = {
    asChild?: boolean;
    children?: ReactNode;
    className?: string;
    testID?: string;
};

const HoverCardTrigger = ({ children }: HoverCardTriggerProps) => <>{children}</>;

export type HoverCardContentProps = {
    side?: string;
    align?: string;
    children?: ReactNode;
    className?: string;
    testID?: string;
};

/** On native, HoverCard.Content renders nothing — hover is a web-only UX. */
const HoverCardContent = (_props: HoverCardContentProps) => null;

export const HoverCard = Object.assign(HoverCardRoot, {
    Trigger: HoverCardTrigger,
    Content: HoverCardContent,
});
