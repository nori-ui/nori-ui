import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { source } from '@/lib/source';

// Inline book/storybook glyph — no icon-set dep.
const BookIcon = (
    <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        role="img"
        aria-label="Storybook"
    >
        <title>Storybook</title>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
);

// Inline sparkles glyph — keeps the layout free of an icon-set dep just
// for one nav adornment.
const SparklesIcon = (
    <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        role="img"
        aria-label="AI sparkle"
    >
        <title>AI sparkle</title>
        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
        <path d="M20 3v4" />
        <path d="M22 5h-4" />
        <path d="M4 17v2" />
        <path d="M5 18H3" />
    </svg>
);

/**
 * Always-visible sidebar banner pill linking to the "For AI agents" page
 * (MCP server, llms.txt, llms-full.txt). Sits above the page navigation
 * so first-time visitors see it without needing to scroll. Mirrors how
 * shadcn/ui surfaces its MCP entry in the docs nav.
 */
const ForAiBanner = (
    <Link
        href="/docs/for-ai"
        className="-mx-2 mb-2 flex items-center gap-2 rounded-lg border border-fd-border bg-fd-card px-3 py-2 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-accent"
    >
        <span className="text-fd-muted-foreground">{SparklesIcon}</span>
        <span>For AI agents</span>
        <span className="ml-auto rounded-md bg-fd-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-fd-primary">
            MCP
        </span>
    </Link>
);

/**
 * Sidebar banner pill linking to the deployed Storybook. Sits below the
 * "For AI agents" pill so both are visible without scrolling. Storybook
 * is served from /storybook (static asset rewrite in next.config.mjs).
 */
const StorybookBanner = (
    <Link
        href="/storybook"
        target="_blank"
        rel="noopener noreferrer"
        className="-mx-2 mb-2 flex items-center gap-2 rounded-lg border border-fd-border bg-fd-card px-3 py-2 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-accent"
    >
        <span className="text-fd-muted-foreground">{BookIcon}</span>
        <span>Storybook</span>
        <span className="ml-auto rounded-md bg-fd-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-fd-primary">
            UI
        </span>
    </Link>
);

const SidebarBanner = (
    <div>
        {StorybookBanner}
        {ForAiBanner}
    </div>
);

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <DocsLayout tree={source.pageTree} nav={{ title: 'nori-ui' }} sidebar={{ banner: SidebarBanner }}>
            {children}
        </DocsLayout>
    );
}
