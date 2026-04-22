import { RootProvider } from 'fumadocs-ui/provider';
import type { ReactNode } from 'react';
import './global.css';

export const metadata = {
    title: 'unbogify-ui — placeholder name',
    description: 'React Native + Web component library, AI-documented, Expo-first.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="flex min-h-screen flex-col bg-white text-neutral-900">
                <RootProvider>{children}</RootProvider>
            </body>
        </html>
    );
}
