'use client';

import { UnbogifyProvider, useTheme } from 'unbogify-ui/client';

function SmokeContent() {
    const theme = useTheme();
    return (
        <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
            <h1 data-testid="title">unbogify-ui playground (web)</h1>
            <p>
                Primary token value resolved from <code>@unbogify/tokens</code>:
            </p>
            <div
                data-testid="primary-swatch"
                style={{
                    width: 96,
                    height: 32,
                    backgroundColor: theme.color.primary['500'],
                    borderRadius: 4,
                }}
            />
            <p data-testid="primary-hex">{theme.color.primary['500']}</p>
        </main>
    );
}

export function App() {
    return (
        <UnbogifyProvider>
            <SmokeContent />
        </UnbogifyProvider>
    );
}
