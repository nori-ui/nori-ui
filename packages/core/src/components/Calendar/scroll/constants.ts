// Initial render window for behavior="scroll".
// The list mounts with this past/future range around the focused month
// and expands lazily as the user scrolls toward an edge.
export const SCROLL_PAST_MONTHS = 12;
export const SCROLL_FUTURE_MONTHS = 24;

// Expansion increment when scroll nears an edge (web ScrollBody only;
// flash-calendar handles its own virtualization).
export const SCROLL_EXPAND_INCREMENT = 12;
