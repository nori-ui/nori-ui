import { fireEvent, render, screen } from '@testing-library/react';
import { Breadcrumb, getBreadcrumbJsonLd } from '../Breadcrumb';

describe('<Breadcrumb> — items mode', () => {
    it('renders every item with the right label and a hrefless current page', () => {
        render(
            <Breadcrumb
                collapseOnOverflow={false}
                items={[{ label: 'Home', href: '/' }, { label: 'Docs', href: '/docs' }, { label: 'Breadcrumb' }]}
            />
        );
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Docs')).toBeInTheDocument();
        expect(screen.getByText('Breadcrumb')).toBeInTheDocument();
        // Last item is auto-flagged as current → no <a> wrapper.
        expect(screen.getByText('Home').closest('a')).toHaveAttribute('href', '/');
        expect(screen.getByText('Breadcrumb').closest('a')).toBeNull();
    });

    it('renders aria-label="Breadcrumb" on the wrapping nav', () => {
        render(<Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'X' }]} />);
        const nav = screen.getByRole('navigation');
        expect(nav.getAttribute('aria-label')).toBe('Breadcrumb');
    });

    it('flags the explicitly current item, not the last, when one is given', () => {
        render(
            <Breadcrumb
                collapseOnOverflow={false}
                items={[
                    { label: 'Home', href: '/' },
                    { label: 'Docs', current: true },
                    { label: 'Breadcrumb', href: '/last' },
                ]}
            />
        );
        // Docs has no href since it's the current item.
        expect(screen.getByText('Docs').closest('a')).toBeNull();
        // The last item is still a link because it wasn't auto-promoted.
        expect(screen.getByText('Breadcrumb').closest('a')).toHaveAttribute('href', '/last');
    });

    it('renders a configurable separator string', () => {
        render(
            <Breadcrumb
                collapseOnOverflow={false}
                separator="/"
                items={[{ label: 'A', href: '/a' }, { label: 'B', href: '/b' }, { label: 'C' }]}
            />
        );
        // Two separators between three items.
        expect(screen.getAllByText('/')).toHaveLength(2);
    });

    it('count-based collapse renders an ellipsis between visible items', () => {
        render(
            <Breadcrumb
                collapseOnOverflow={false}
                maxItems={3}
                itemsBeforeCollapse={1}
                itemsAfterCollapse={1}
                items={[
                    { label: 'A', href: '/a' },
                    { label: 'B', href: '/b' },
                    { label: 'C', href: '/c' },
                    { label: 'D', href: '/d' },
                    { label: 'E' },
                ]}
            />
        );
        expect(screen.getByText('A')).toBeInTheDocument();
        expect(screen.getByText('E')).toBeInTheDocument();
        // Middle items are hidden.
        expect(screen.queryByText('B')).toBeNull();
        expect(screen.queryByText('C')).toBeNull();
        expect(screen.queryByText('D')).toBeNull();
        // Ellipsis is shown.
        expect(screen.getByText('…')).toBeInTheDocument();
    });

    it('inline expand reveals the hidden items when the ellipsis is clicked', () => {
        render(
            <Breadcrumb
                collapseOnOverflow={false}
                maxItems={3}
                expandBehavior="inline"
                items={[
                    { label: 'A', href: '/a' },
                    { label: 'B', href: '/b' },
                    { label: 'C', href: '/c' },
                    { label: 'D', href: '/d' },
                    { label: 'E' },
                ]}
            />
        );
        const ellipsisBtn = screen.getByRole('button', { name: 'Show full path' });
        fireEvent.click(ellipsisBtn);
        // All items now visible — ellipsis gone.
        expect(screen.getByText('B')).toBeInTheDocument();
        expect(screen.getByText('C')).toBeInTheDocument();
        expect(screen.getByText('D')).toBeInTheDocument();
        expect(screen.queryByText('…')).toBeNull();
    });

    it('expandBehavior="none" leaves the ellipsis non-interactive', () => {
        render(
            <Breadcrumb
                collapseOnOverflow={false}
                maxItems={2}
                expandBehavior="none"
                items={[{ label: 'A', href: '/a' }, { label: 'B', href: '/b' }, { label: 'C' }]}
            />
        );
        // No expand button, no menu trigger.
        expect(screen.queryByRole('button', { name: 'Show full path' })).toBeNull();
        expect(screen.queryByLabelText('More')).toBeInTheDocument();
    });

    it('falls through to children when no items prop is given (compound mode)', () => {
        render(
            <Breadcrumb separator="/">
                <Breadcrumb.List>
                    <Breadcrumb.Item>
                        <Breadcrumb.Link href="/">Home</Breadcrumb.Link>
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>
                        <Breadcrumb.Page>Settings</Breadcrumb.Page>
                    </Breadcrumb.Item>
                </Breadcrumb.List>
            </Breadcrumb>
        );
        expect(screen.getByText('Home').closest('a')).toHaveAttribute('href', '/');
        expect(screen.getByText('Settings')).toBeInTheDocument();
        // Current page has aria-current="page".
        const pageEl = screen.getByText('Settings').closest('[aria-current]');
        expect(pageEl?.getAttribute('aria-current')).toBe('page');
    });

    it('compound mode auto-inserts separators between consecutive items', () => {
        render(
            <Breadcrumb separator="•">
                <Breadcrumb.List>
                    <Breadcrumb.Item>
                        <Breadcrumb.Link href="/">A</Breadcrumb.Link>
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>
                        <Breadcrumb.Link href="/b">B</Breadcrumb.Link>
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>
                        <Breadcrumb.Page>C</Breadcrumb.Page>
                    </Breadcrumb.Item>
                </Breadcrumb.List>
            </Breadcrumb>
        );
        expect(screen.getAllByText('•')).toHaveLength(2);
    });

    it('throws a clear error when a compound subcomponent is rendered standalone', () => {
        const original = console.error;
        console.error = () => {};
        try {
            expect(() => render(<Breadcrumb.Item>x</Breadcrumb.Item>)).toThrow(/Breadcrumb\.Item/);
        } finally {
            console.error = original;
        }
    });

    it('truncates long labels when maxLabelLength is set', () => {
        render(
            <Breadcrumb
                collapseOnOverflow={false}
                maxLabelLength={5}
                items={[{ label: 'Settings — Personal', href: '/' }, { label: 'Profile' }]}
            />
        );
        expect(screen.queryByText('Settings — Personal')).toBeNull();
        expect(screen.getByText('Sett…')).toBeInTheDocument();
    });

    it('per-item maxLabelLength overrides the root maxLabelLength', () => {
        render(
            <Breadcrumb
                collapseOnOverflow={false}
                maxLabelLength={5}
                items={[{ label: 'Documents', href: '/d', maxLabelLength: 8 }, { label: 'Photo Albums' }]}
            />
        );
        // truncateString keeps `max` total chars including the ellipsis.
        expect(screen.getByText('Documen…')).toBeInTheDocument();
        // Without override, root limit applies.
        expect(screen.getByText('Phot…')).toBeInTheDocument();
    });

    it('renders icons via the per-item icon prop', () => {
        const HomeIcon = ({ size = 14, color }: { size?: number; color?: string }) => (
            <svg data-testid="home-icon" width={size} height={size} fill={color} role="img" aria-label="home">
                <title>home</title>
                <path d="M0 0h1v1H0z" />
            </svg>
        );
        render(
            <Breadcrumb
                collapseOnOverflow={false}
                items={[{ label: 'Home', href: '/', icon: HomeIcon }, { label: 'Page' }]}
            />
        );
        expect(screen.getByTestId('home-icon')).toBeInTheDocument();
    });

    it('omits items mode when items is empty and renders compound children instead', () => {
        render(
            <Breadcrumb items={[]}>
                <Breadcrumb.List>
                    <Breadcrumb.Item>
                        <Breadcrumb.Link href="/">Fallback</Breadcrumb.Link>
                    </Breadcrumb.Item>
                </Breadcrumb.List>
            </Breadcrumb>
        );
        expect(screen.getByText('Fallback').closest('a')).toHaveAttribute('href', '/');
    });

    it('current page is announced via aria-current="page"', () => {
        render(<Breadcrumb collapseOnOverflow={false} items={[{ label: 'Home', href: '/' }, { label: 'Settings' }]} />);
        // Find the descendant that has aria-current="page" — it wraps the label.
        const currentEls = document.querySelectorAll('[aria-current="page"]');
        expect(currentEls.length).toBeGreaterThanOrEqual(1);
    });

    it('width-based collapse is on by default — renders the hidden measurement copy', () => {
        // Default `collapseOnOverflow` is true, so each label appears twice in
        // the DOM: once in the visible row, once in the offscreen measurement
        // pass that the layout algorithm uses to pick which items fit.
        render(<Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Settings' }]} />);
        expect(screen.getAllByText('Home')).toHaveLength(2);
        expect(screen.getAllByText('Settings')).toHaveLength(2);
    });
});

describe('getBreadcrumbJsonLd', () => {
    it('emits a valid BreadcrumbList document with 1-based positions', () => {
        const json = getBreadcrumbJsonLd([
            { label: 'Home', href: 'https://x.test/' },
            { label: 'Docs', href: 'https://x.test/docs' },
            { label: 'Page' },
        ]);
        const parsed = JSON.parse(json);
        expect(parsed['@context']).toBe('https://schema.org');
        expect(parsed['@type']).toBe('BreadcrumbList');
        expect(parsed.itemListElement).toHaveLength(3);
        expect(parsed.itemListElement[0]).toMatchObject({
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://x.test/',
        });
        // Page (no href) — `item` is omitted, not synthesized.
        expect(parsed.itemListElement[2].item).toBeUndefined();
    });

    it('skips items whose label is not a string (avoids polluting JSON-LD with rendered nodes)', () => {
        const json = getBreadcrumbJsonLd([
            { label: 'Home', href: '/' },
            { label: <span>Custom</span>, href: '/c' },
        ]);
        const parsed = JSON.parse(json);
        expect(parsed.itemListElement).toHaveLength(1);
        expect(parsed.itemListElement[0].name).toBe('Home');
    });
});
