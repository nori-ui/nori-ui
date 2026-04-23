import { RootProvider } from 'fumadocs-ui/provider';
import type { ReactNode } from 'react';
import './global.css';

export const metadata = {
    title: 'nori-ui — React Native + Web components',
    description: 'React Native + Web component library, AI-documented, Expo-first.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="flex min-h-screen flex-col bg-fd-background text-fd-foreground">
                <RootProvider>{children}</RootProvider>
            </body>
        </html>
    );
}
