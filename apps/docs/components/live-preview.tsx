'use client';

import type { ReactNode } from 'react';
import { UnbogifyProvider } from 'unbogify-ui/client';

export type LivePreviewProps = {
    children: ReactNode;
    className?: string;
};

/**
 * Renders a component inline using the actual `unbogify-ui` web build
 * (via react-native-web alias at the Next.js layer). Consumers of the
 * docs see exactly the component they'd install.
 */
export function LivePreview({ children, className }: LivePreviewProps) {
    return (
        <div className={`rounded-lg border border-neutral-200 bg-white p-6 ${className ?? ''}`}>
            <UnbogifyProvider>{children}</UnbogifyProvider>
        </div>
    );
}
