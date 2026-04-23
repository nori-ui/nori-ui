import Link from 'next/link';

export default function Home() {
    return (
        <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
            <h1 className="text-4xl font-bold">nori-ui</h1>
            <p className="text-lg text-fd-muted-foreground">
                A React Native + Web component library. Expo-first, NativeWind v4, Figma design tokens, AI-queryable
                docs.
            </p>
            <Link className="text-fd-primary underline" href="/docs">
                Read the docs →
            </Link>
        </main>
    );
}
