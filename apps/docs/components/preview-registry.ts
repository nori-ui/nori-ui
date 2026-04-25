import type { ComponentType } from 'react';

import BoxBasic from './demos/box-basic';
import ButtonBasic from './demos/button-basic';
import CheckboxBasic from './demos/checkbox-basic';
import HStackBasic from './demos/hstack-basic';
import IconBasic from './demos/icon-basic';
import SpinnerBasic from './demos/spinner-basic';
import SwitchBasic from './demos/switch-basic';
import TextAreaBasic from './demos/text-area-basic';
import TextBasic from './demos/text-basic';
import TextInputBasic from './demos/text-input-basic';
import VStackBasic from './demos/vstack-basic';
import { previewSources } from './preview-sources.generated';

type PreviewEntry = {
    Component: ComponentType;
    source: string;
};

/**
 * Registry of named demos used by `<Preview name="..." />` in MDX.
 *
 * Each entry pairs the rendered component with the verbatim source of the
 * demo file. Sources come from `preview-sources.generated.ts`, produced by
 * `scripts/generate-preview-sources.mjs` at predev/prebuild time. Pairing
 * this way means the "Code" tab can never drift from the live preview —
 * both originate from the same `.tsx` file.
 *
 * To add a demo:
 *   1. Drop a self-contained `.tsx` file into `./demos/<name>.tsx` whose
 *      default export is the demo component.
 *   2. Import the component here.
 *   3. Add an entry below; the key MUST match the file name (without `.tsx`).
 *   4. Reference it in MDX as `<Preview name="<name>" />`.
 *
 * Sources regenerate automatically — no manual step required.
 */
export const previews = {
    'text-basic': { Component: TextBasic, source: previewSources['text-basic'] },
    'box-basic': { Component: BoxBasic, source: previewSources['box-basic'] },
    'hstack-basic': { Component: HStackBasic, source: previewSources['hstack-basic'] },
    'vstack-basic': { Component: VStackBasic, source: previewSources['vstack-basic'] },
    'spinner-basic': { Component: SpinnerBasic, source: previewSources['spinner-basic'] },
    'button-basic': { Component: ButtonBasic, source: previewSources['button-basic'] },
    'text-input-basic': { Component: TextInputBasic, source: previewSources['text-input-basic'] },
    'text-area-basic': { Component: TextAreaBasic, source: previewSources['text-area-basic'] },
    'checkbox-basic': { Component: CheckboxBasic, source: previewSources['checkbox-basic'] },
    'switch-basic': { Component: SwitchBasic, source: previewSources['switch-basic'] },
    'icon-basic': { Component: IconBasic, source: previewSources['icon-basic'] },
} as const satisfies Record<string, PreviewEntry>;

export type PreviewName = keyof typeof previews;
