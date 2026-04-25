import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type GitHubRelease = {
    tag_name: string;
    name: string | null;
    published_at: string | null;
    html_url: string;
    body: string | null;
    prerelease: boolean;
};

const REPO = 'nori-ui/nori-ui';
const API = `https://api.github.com/repos/${REPO}/releases?per_page=50`;

/**
 * Async server component that fetches every published release from the
 * GitHub Releases API and renders the body of each as Markdown. Cached for
 * an hour via Next.js's fetch revalidation so dev reloads don't burn the
 * unauthenticated API rate limit.
 *
 * Source of truth is GitHub Releases (driven by semantic-release on tag
 * push). If you need a draft entry that hasn't shipped yet, edit the
 * release on GitHub — don't fork the page.
 */
export async function Changelog() {
    let releases: GitHubRelease[] = [];
    let fetchError: string | null = null;
    try {
        const res = await fetch(API, {
            headers: { Accept: 'application/vnd.github+json' },
            next: { revalidate: 3600 },
        });
        if (!res.ok) {
            fetchError = `GitHub API responded ${res.status}`;
        } else {
            releases = (await res.json()) as GitHubRelease[];
        }
    } catch (err) {
        fetchError = err instanceof Error ? err.message : 'Unknown fetch error';
    }

    if (fetchError) {
        return (
            <div
                role="alert"
                className="my-4 rounded-md border border-fd-border bg-fd-card p-4 text-fd-muted-foreground"
            >
                Could not load releases from GitHub ({fetchError}). The full history lives at{' '}
                <a className="text-fd-primary underline" href={`https://github.com/${REPO}/releases`}>
                    github.com/{REPO}/releases
                </a>
                .
            </div>
        );
    }

    if (releases.length === 0) {
        return (
            <p className="text-fd-muted-foreground">
                No releases yet. Follow{' '}
                <a className="text-fd-primary underline" href={`https://github.com/${REPO}/commits/main`}>
                    the commit history on GitHub
                </a>{' '}
                until the first tagged release ships.
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            {releases.map((release) => {
                const date = release.published_at
                    ? new Date(release.published_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                      })
                    : 'unreleased';
                return (
                    <section key={release.tag_name} className="rounded-lg border border-fd-border bg-fd-card p-6">
                        <header className="mb-3 flex flex-wrap items-baseline gap-3">
                            <h2 className="m-0 text-xl font-semibold">
                                <a className="hover:underline" href={release.html_url}>
                                    {release.name ?? release.tag_name}
                                </a>
                            </h2>
                            <span className="text-sm text-fd-muted-foreground">{date}</span>
                            {release.prerelease ? (
                                <span className="rounded-full border border-fd-border px-2 py-0.5 text-xs text-fd-muted-foreground">
                                    pre-release
                                </span>
                            ) : null}
                        </header>
                        {release.body ? (
                            <Markdown remarkPlugins={[remarkGfm]}>{release.body}</Markdown>
                        ) : (
                            <p className="text-fd-muted-foreground">No release notes for this version.</p>
                        )}
                    </section>
                );
            })}
        </div>
    );
}
