'use client';

import { NoriProvider } from '@nori-ui/core/client';
import { CodeBlock } from 'fumadocs-ui/components/codeblock';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { useEffect, useState } from 'react';
import { HighlightedCode } from '@/lib/highlight';
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

    return (
        <Tabs items={[...TABS]} defaultIndex={0}>
            <Tab value="Preview">
                <div className="rounded-lg border border-fd-border bg-fd-background" style={{ padding }}>
                    {mounted ? (
                        <NoriProvider>
                            <Component />
                        </NoriProvider>
                    ) : null}
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
