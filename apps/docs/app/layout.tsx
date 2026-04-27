import { RootProvider } from 'fumadocs-ui/provider';
import { Fraunces } from 'next/font/google';
import type { ReactNode } from 'react';
import { DocsThemeProvider } from '@/components/docs-theme-provider';
import { ThemeSwitcher } from '@/components/theme-switcher';
import './global.css';

// Display face for headings — variable serif with optical sizing + a SOFT
// axis. Loaded via next/font so it's self-hosted, preloaded, and CLS-free.
// Headings reference it in global.css via `var(--font-fraunces)`.
const fraunces = Fraunces({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-fraunces',
    axes: ['SOFT', 'opsz'],
});

export const metadata = {
    title: 'nori-ui — React Native + Web components',
    description: 'React Native + Web component library, AI-documented, Expo-first.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning className={fraunces.variable}>
            <body className="flex min-h-screen flex-col bg-fd-background text-fd-foreground">
                <RootProvider>
                    <DocsThemeProvider>
                        {children}
                        <ThemeSwitcher />
                    </DocsThemeProvider>
                </RootProvider>
            </body>
        </html>
    );
}
