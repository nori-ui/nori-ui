import Link from 'next/link';

export default function Home() {
    return (
        <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
            <h1 className="text-4xl font-bold">nori-ui</h1>
            <p className="text-lg text-neutral-700">
                React Native + Web component library. Placeholder name — will be renamed before v0.1.
            </p>
            <Link className="text-primary-600 underline" href="/docs">
                Read the docs →
            </Link>
        </main>
    );
}
