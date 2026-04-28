import { notFound, redirect } from 'next/navigation';
import { isKnownComponentSlug } from '@/lib/component-slugs';

type Params = { slug: string };

/**
 * Universal-Link landing page.
 *
 * `https://nori-ui.com/components/<slug>` is the canonical share-this-
 * component URL. iOS devices with the playground app installed never reach
 * this route — Apple intercepts the URL via AASA and routes it directly
 * into `nori-ui://components/<slug>` (handled in Spec A). Everyone else
 * (web browsers, Android, iOS without the app) lands here and is 302'd to
 * the docs page. Unknown slugs 404 rather than silently redirecting to a
 * non-existent docs URL.
 */
export default async function ComponentLandingPage({ params }: { params: Promise<Params> }) {
    const { slug } = await params;
    if (!isKnownComponentSlug(slug)) {
        notFound();
    }
    redirect(`/docs/components/${slug}`);
}
