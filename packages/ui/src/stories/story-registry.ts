// Story registry — enumerated list of CSF stories in the library.
// Used by playground-native (which can't auto-discover via Storybook) to
// render the same set of variants.
//
// Each entry maps a display title to a render function. Plan 05 adds one
// entry per component variant.

import type { ComponentType } from 'react';

export type StoryEntry = {
    /** Dot-separated story id, e.g. "Button/Primary" */
    id: string;
    /** Human title shown in Storybook + playground-native */
    title: string;
    /** Renderable component (already wrapped with its args) */
    render: ComponentType<Record<string, never>>;
};

export const stories: StoryEntry[] = [
    // Plan 05 appends entries as each component ships.
];
