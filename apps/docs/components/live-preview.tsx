'use client';

import { NoriProvider } from '@nori-ui/core/client';
import { type ReactNode, useEffect, useState } from 'react';

export type LivePreviewProps = {
    children: ReactNode;
    className?: string;
};

/**
 * Renders a component inline using the actual `nori-ui` web build
 * (via react-native-web alias at the Next.js layer). Consumers of the
 * docs see exactly the component they'd install.
 *
 * Children are mounted after hydration to avoid serializing event handlers
 * across the server/client boundary — several `nori-ui` components rely on
 * RN `Pressable` internals that do not cross an RSC boundary cleanly.
 */
export function LivePreview({ children, className }: LivePreviewProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    return (
        <div className={`rounded-lg border border-neutral-200 bg-white p-6 ${className ?? ''}`}>
            {mounted ? <NoriProvider>{children}</NoriProvider> : null}
        </div>
    );
}
