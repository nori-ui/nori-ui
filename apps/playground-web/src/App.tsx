'use client';

import { UnbogifyProvider } from 'unbogify-ui/client';
import { stories } from 'unbogify-ui/stories';

function StoriesPage() {
    return (
        <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif', display: 'grid', gap: 24 }}>
            <h1 data-testid="title">unbogify-ui playground (web)</h1>
            {stories.map(({ id, title, render: Render }) => (
                <section
                    key={id}
                    data-testid={`section-${id}`}
                    style={{ borderTop: '1px solid #e4e4e7', paddingTop: 12 }}
                >
                    <h2 style={{ fontSize: 14, fontWeight: 500, margin: '0 0 8px' }}>{title}</h2>
                    <Render />
                </section>
            ))}
        </main>
    );
}

export function App() {
    return (
        <UnbogifyProvider>
            <StoriesPage />
        </UnbogifyProvider>
    );
}
