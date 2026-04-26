import type { ComponentType } from 'react';

import type { Highlighted } from '@/lib/highlight';
import BoxBasic from './demos/box-basic';
import ButtonBasic from './demos/button-basic';
import CheckboxBasic from './demos/checkbox-basic';
import HStackBasic from './demos/hstack-basic';
import HStackFlex from './demos/hstack-flex';
import IconBasic from './demos/icon-basic';
import SpinnerBasic from './demos/spinner-basic';
import SwitchBasic from './demos/switch-basic';
import TextAreaBasic from './demos/text-area-basic';
import TextBasic from './demos/text-basic';
import TextInputBasic from './demos/text-input-basic';
import VStackBasic from './demos/vstack-basic';
import { previewSources } from './preview-sources.generated';

type PreviewEntry = Highlighted & {
    Component: ComponentType;
    /** Verbatim demo source — feeds the underlying `pre.textContent` so the copy button hands back the original file. */
    raw: string;
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
export const previews = {
    'text-basic': { Component: TextBasic, ...previewSources['text-basic'] },
    'box-basic': { Component: BoxBasic, ...previewSources['box-basic'] },
    'hstack-basic': { Component: HStackBasic, ...previewSources['hstack-basic'] },
    'hstack-flex': { Component: HStackFlex, ...previewSources['hstack-flex'] },
    'vstack-basic': { Component: VStackBasic, ...previewSources['vstack-basic'] },
    'spinner-basic': { Component: SpinnerBasic, ...previewSources['spinner-basic'] },
    'button-basic': { Component: ButtonBasic, ...previewSources['button-basic'] },
    'text-input-basic': { Component: TextInputBasic, ...previewSources['text-input-basic'] },
    'text-area-basic': { Component: TextAreaBasic, ...previewSources['text-area-basic'] },
    'checkbox-basic': { Component: CheckboxBasic, ...previewSources['checkbox-basic'] },
    'switch-basic': { Component: SwitchBasic, ...previewSources['switch-basic'] },
    'icon-basic': { Component: IconBasic, ...previewSources['icon-basic'] },
} as const satisfies Record<string, PreviewEntry>;

export type PreviewName = keyof typeof previews;
