'use client';

import { NoriProvider } from 'nori-ui/client';
import { stories } from 'nori-ui/stories';

function StoriesPage() {
    return (
        <main className="mx-auto max-w-4xl px-6 py-10 font-sans text-neutral-900">
            <header className="mb-10 border-b border-neutral-200 pb-6">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Playground · Web</p>
                <h1 className="mt-2 text-3xl font-bold text-neutral-900" data-testid="title">
                    nori-ui playground (web)
                </h1>
                <p className="mt-2 text-sm text-neutral-600">
                    Live renderings of every story in{' '}
                    <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">@nori-ui/ui</code>. Used as the
                    Playwright target for e2e tests.
                </p>
            </header>

            <div className="grid gap-8">
                {stories.map(({ id, title, render: Render }) => (
                    <section
                        key={id}
                        data-testid={`section-${id}`}
                        className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm"
                    >
                        <h2 className="mb-3 text-sm font-medium text-neutral-500">{title}</h2>
                        <div className="rounded-md bg-neutral-50 p-4">
                            <Render />
                        </div>
                    </section>
                ))}
            </div>
        </main>
    );
}

export function App() {
    return (
        <NoriProvider>
            <StoriesPage />
        </NoriProvider>
    );
}
