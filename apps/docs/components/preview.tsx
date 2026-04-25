'use client';

import { NoriProvider } from '@nori-ui/core/client';
import { CodeBlock } from 'fumadocs-ui/components/codeblock';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { useEffect, useState } from 'react';
import { HighlightedCode } from '@/lib/highlight';
import {
    PREVIEW_DIRECTION_OPTIONS,
    PREVIEW_LOCALE_OPTIONS,
    PREVIEW_LOCALES,
    type PreviewDirection,
    type PreviewLocale,
} from '@/lib/preview-locales';
import { type PreviewName, previews } from './preview-registry';

export type PreviewProps = {
    /** Demo identifier — see `apps/docs/components/preview-registry.ts`. */
    name: PreviewName;
    /** Optional padding override for the preview frame in `px`. Default 24. */
    padding?: number;
};

const TABS = ['Preview', 'Code'] as const;

/**
 * Renders a tabbed live demo: a real `nori-ui` component on one tab, and the
 * verbatim source of the demo file on the other.
 *
 * Two preview controls sit above the demo frame:
 *   - **Direction** flips the wrapping `dir` attribute between `ltr` and `rtl`.
 *     Surfaces RTL layout regressions immediately.
 *   - **Locale** swaps the `<NoriProvider i18n={...}>` dictionary between
 *     `en` / `de` / `ja`. Mostly affects accessibility labels for v0
 *     components (visible text in the demos is the demo author's own); will
 *     grow more visible as the library exposes more localized strings.
 *
 * Why post-mount: `nori-ui` interactive components rely on React Native
 * `Pressable`, whose event handlers don't serialize across the RSC server →
 * client boundary. Mounting after hydration sidesteps the issue.
 *
 * Source comes from the same `.tsx` file that runs the live preview, so the
 * two views can never disagree.
 */
export function Preview({ name, padding = 24 }: PreviewProps) {
    const entry = previews[name];
    const [mounted, setMounted] = useState(false);
    const [direction, setDirection] = useState<PreviewDirection>('ltr');
    const [locale, setLocale] = useState<PreviewLocale>('en');
    useEffect(() => setMounted(true), []);

    if (!entry) {
        return (
            <div
                role="alert"
                className="my-6 rounded-lg border border-dashed border-fd-border p-4 text-fd-muted-foreground"
            >
                Preview <code>{name}</code> is not registered. Add it to{' '}
                <code>apps/docs/components/preview-registry.ts</code>.
            </div>
        );
    }

    const { Component, tokens, rootStyle } = entry;
    const dictionary = PREVIEW_LOCALES[locale];

    return (
        <Tabs items={[...TABS]} defaultIndex={0}>
            <Tab value="Preview">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-fd-muted-foreground">
                        <Pills
                            label="Direction"
                            value={direction}
                            options={PREVIEW_DIRECTION_OPTIONS}
                            onChange={setDirection}
                        />
                        <Pills label="Locale" value={locale} options={PREVIEW_LOCALE_OPTIONS} onChange={setLocale} />
                    </div>
                    <div
                        className="rounded-lg border border-fd-border bg-fd-background"
                        style={{ padding }}
                        dir={direction}
                    >
                        {mounted ? (
                            <NoriProvider {...(dictionary !== undefined ? { i18n: dictionary } : {})}>
                                <Component />
                            </NoriProvider>
                        ) : null}
                    </div>
                </div>
            </Tab>
            <Tab value="Code">
                <CodeBlock>
                    <HighlightedCode
                        tokens={tokens}
                        rootStyle={rootStyle}
                        className="overflow-x-auto p-4 text-[13px]"
                    />
                </CodeBlock>
            </Tab>
        </Tabs>
    );
}

type PillsProps<T extends string> = {
    label: string;
    value: T;
    options: readonly T[];
    onChange: (next: T) => void;
};

function Pills<T extends string>({ label, value, options, onChange }: PillsProps<T>) {
    const groupName = `pills-${label.toLowerCase()}`;
    return (
        <fieldset className="flex items-center gap-1.5 border-0 p-0">
            <legend className="float-left mr-1.5 p-0">{label}:</legend>
            <div className="inline-flex overflow-hidden rounded-md border border-fd-border">
                {options.map((opt) => {
                    const selected = opt === value;
                    return (
                        <label
                            key={opt}
                            className={`cursor-pointer px-2 py-1 font-mono uppercase tracking-wide ${selected ? 'bg-fd-accent text-fd-foreground' : 'text-fd-muted-foreground hover:bg-fd-accent/40'}`}
                        >
                            <input
                                type="radio"
                                name={groupName}
                                value={opt}
                                checked={selected}
                                onChange={() => onChange(opt)}
                                className="sr-only"
                            />
                            {opt}
                        </label>
                    );
                })}
            </div>
        </fieldset>
    );
}
