import corePkg from '@nori-ui/core/package.json';
import Image from 'next/image';
import Link from 'next/link';
import './landing.css';

const coreVersion = corePkg.version;

// Editorial landing — refined, asymmetric, brand-forward.
//
// Aesthetic: Japanese craft / editorial. The logo's palette (forest,
// sage, cream) carries the entire page; the wordmark "nori" is the one
// big typographic gesture, set in Fraunces variable serif. No gradient
// purple, no oversized hero card, no sea of feature tiles — just a
// quiet brand statement and a single, generous link to the docs.
//
// Self-contained: no shared chrome, scoped CSS variables, page-level
// CSS animations only. Doesn't touch fumadocs's global theme.

const features = ['React Native', 'React Web', 'AI-documented', 'Figma design tokens'];

export default function Home() {
    return (
        <main className="nori-landing">
            <div className="nori-grain" aria-hidden />
            <div className="nori-glow" aria-hidden />

            <header className="nori-header">
                <Image src="/logo-mark.png" alt="" width={56} height={56} priority className="nori-mark" />
                <span className="nori-meta">v{coreVersion} · open source</span>
            </header>

            <section className="nori-hero">
                <div className="nori-eyebrow">A component library</div>

                <h1 className="nori-display">
                    {/* The wordmark is the brand artifact — set in a custom
                        serif with sage and cream leaf accents above the i-dots.
                        Using the PNG directly preserves those accents pixel-for-pixel
                        instead of trying to reproduce them in live type. */}
                    <Image
                        src="/wordmark.png"
                        alt="Nori UI"
                        width={1024}
                        height={264}
                        priority
                        className="nori-wordmark"
                    />
                </h1>

                <p className="nori-lede">
                    A component library for builders who care about the small things — typography that breathes, motion
                    that whispers, primitives that work everywhere. Designed in equal measure for the people who use it
                    and the agents that read its docs. Native and web, from the same source.
                </p>

                <div className="nori-cta-row">
                    <Link href="/docs" className="nori-cta" aria-label="Read the documentation">
                        <span className="nori-cta-label">Read the docs</span>
                        <span className="nori-cta-arrow" aria-hidden>
                            <svg
                                width="22"
                                height="14"
                                viewBox="0 0 22 14"
                                fill="none"
                                role="img"
                                aria-label="arrow"
                                focusable={false}
                            >
                                <title>arrow</title>
                                <path
                                    d="M1 7H20.5M14 1L20.5 7L14 13"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </span>
                    </Link>

                    <Link
                        href="https://github.com/nori-ui/nori-ui"
                        className="nori-secondary"
                        rel="noopener noreferrer"
                    >
                        github
                        <span aria-hidden>↗</span>
                    </Link>
                </div>

                <ul className="nori-features">
                    {features.map((label, i) => (
                        <li key={label} style={{ animationDelay: `${600 + i * 80}ms` }}>
                            <span className="nori-features-dot" aria-hidden />
                            {label}
                        </li>
                    ))}
                </ul>
            </section>

            <footer className="nori-footer">
                <span>nori-ui · {new Date().getFullYear()}</span>
                <span className="nori-rule" aria-hidden />
            </footer>
        </main>
    );
}
