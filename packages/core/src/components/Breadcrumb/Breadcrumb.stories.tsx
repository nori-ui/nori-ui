import type { Meta, StoryObj } from '@storybook/react';
import { Platform, Text as RNText } from 'react-native';
import { Text } from '../Text';
import { VStack } from '../VStack';
import { Breadcrumb } from './Breadcrumb';

const meta: Meta<typeof Breadcrumb> = {
    title: 'Navigation/Breadcrumb',
    component: Breadcrumb,
};
export default meta;
type Story = StoryObj<typeof Breadcrumb>;

// Cross-platform icons: SVG on web, RN-Text glyph on native. Mirrors the
// pattern in `default-semantic-icons.tsx` so the stories render cleanly
// in BOTH the docs site and the native playground (`<svg>`/`<title>`/
// `<path>` are not native host components — emitting them on iOS/Android
// raises "View config getter callback for component 'title'" errors).

type IconProps = { size?: number; color?: string };

function makeIcon(svgPath: string, glyph: string, ariaLabel: string) {
    return function Icon({ size = 14, color = 'currentColor' }: IconProps) {
        if (Platform.OS === 'web') {
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    role="img"
                    aria-label={ariaLabel}
                >
                    <title>{ariaLabel}</title>
                    <path d={svgPath} />
                </svg>
            );
        }
        return <RNText style={{ fontSize: size, lineHeight: size, color }}>{glyph}</RNText>;
    };
}

const HomeIcon = makeIcon('m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', '⌂', 'Home');
const FolderIcon = makeIcon(
    'M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z',
    '📁',
    'Folder'
);
const FileIcon = makeIcon('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', '📄', 'File');

/** The shortest path to a useful breadcrumb — items array with default chevron separators. */
export const Basic: Story = {
    render: () => (
        <Breadcrumb
            items={[
                { label: 'Home', href: '/' },
                { label: 'Docs', href: '/docs' },
                { label: 'Components', href: '/docs/components' },
                { label: 'Breadcrumb' },
            ]}
        />
    ),
};

/** Custom separator. Strings render as text; ReactNode and (ctx) → ReactNode also work. */
export const CustomSeparator: Story = {
    render: () => (
        <VStack gap={3}>
            <Breadcrumb
                separator="/"
                items={[{ label: 'Home', href: '/' }, { label: 'Docs', href: '/docs' }, { label: 'Page' }]}
            />
            <Breadcrumb
                separator="•"
                items={[{ label: 'Home', href: '/' }, { label: 'Docs', href: '/docs' }, { label: 'Page' }]}
            />
            <Breadcrumb
                separator="→"
                items={[{ label: 'Home', href: '/' }, { label: 'Docs', href: '/docs' }, { label: 'Page' }]}
            />
        </VStack>
    ),
};

/** Per-item icons via the `icon` prop. Folder/file pattern from VSCode-style file paths. */
export const WithIcons: Story = {
    render: () => (
        <Breadcrumb
            items={[
                { label: 'Home', href: '/', icon: HomeIcon },
                { label: 'Programs', href: '/programs', icon: FolderIcon },
                { label: 'Files', href: '/programs/files', icon: FolderIcon },
                { label: 'Services', href: '/programs/files/services', icon: FolderIcon },
                { label: 'bablo.txt', icon: FileIcon },
            ]}
        />
    ),
};

/** Count-based collapse: the middle of the trail folds into a single ellipsis. */
export const CountCollapse: Story = {
    render: () => (
        <Breadcrumb
            maxItems={3}
            itemsBeforeCollapse={1}
            itemsAfterCollapse={1}
            items={[
                { label: 'Home', href: '/' },
                { label: 'Docs', href: '/docs' },
                { label: 'Components', href: '/docs/components' },
                { label: 'Navigation', href: '/docs/components/navigation' },
                { label: 'Breadcrumb' },
            ]}
        />
    ),
};

/** Click the ellipsis to expand the trail inline (web default). */
export const InlineExpand: Story = {
    render: () => (
        <Breadcrumb
            maxItems={3}
            expandBehavior="inline"
            items={[
                { label: 'Home', href: '/' },
                { label: 'Docs', href: '/docs' },
                { label: 'Components', href: '/docs/components' },
                { label: 'Navigation', href: '/docs/components/navigation' },
                { label: 'Breadcrumb' },
            ]}
        />
    ),
};

/** Click the ellipsis to open the hidden items in a popover menu (native default). */
export const MenuExpand: Story = {
    render: () => (
        <Breadcrumb
            maxItems={3}
            expandBehavior="menu"
            items={[
                { label: 'Home', href: '/' },
                { label: 'Docs', href: '/docs' },
                { label: 'Components', href: '/docs/components' },
                { label: 'Navigation', href: '/docs/components/navigation' },
                { label: 'Breadcrumb' },
            ]}
        />
    ),
};

/**
 * Width-based collapse uses `onLayout` (cross-platform; works on RN-Web
 * via its ResizeObserver shim and on native via the layout system).
 * Resize the canvas to see middle items collapse into the ellipsis.
 *
 * Web-only: a phone viewport has no resizable container, so the demo
 * has nothing to demonstrate on native. The default `collapseOnOverflow`
 * behavior is already covered by the `WithIcons` story on both platforms.
 */
export const WidthCollapse: Story = {
    parameters: { platforms: ['web'] },
    render: () => (
        <VStack gap={2}>
            <Text>Try resizing the canvas — the trail collapses to fit.</Text>
            <Breadcrumb
                collapseOnOverflow
                items={[
                    { label: 'Home', href: '/', icon: HomeIcon },
                    { label: 'Programs', href: '/programs', icon: FolderIcon },
                    { label: 'Files', href: '/programs/files', icon: FolderIcon },
                    { label: 'Services', href: '/programs/files/services', icon: FolderIcon },
                    { label: 'Background', href: '/programs/files/services/bg', icon: FolderIcon },
                    { label: 'configuration.txt', icon: FileIcon },
                ]}
            />
        </VStack>
    ),
};

/**
 * Per-item sibling menu — the VSCode/file-path pattern. Clicking the
 * chevron next to a crumb opens a list of siblings at that hierarchy
 * level.
 */
export const SiblingMenu: Story = {
    render: () => (
        <Breadcrumb
            items={[
                { label: 'Home', href: '/', icon: HomeIcon },
                {
                    label: 'Programs',
                    href: '/programs',
                    icon: FolderIcon,
                    siblings: [
                        { label: 'Documents', href: '/documents', icon: FolderIcon },
                        { label: 'Downloads', href: '/downloads', icon: FolderIcon },
                        { label: 'Music', href: '/music', icon: FolderIcon },
                    ],
                },
                { label: 'configuration.txt', icon: FileIcon },
            ]}
        />
    ),
};

/** Skeleton crumbs while async paths resolve. */
export const Loading: Story = {
    render: () => (
        <Breadcrumb
            items={[
                { label: 'Home', href: '/' },
                { label: '', loading: true },
                { label: '', loading: true },
                { label: 'Page' },
            ]}
        />
    ),
};

/** Per-item label truncation. */
export const Truncated: Story = {
    render: () => (
        <Breadcrumb
            maxLabelLength={12}
            items={[
                { label: 'Home', href: '/' },
                { label: 'A very long folder name that wraps everything', href: '/x' },
                { label: 'Settings — preferences and advanced options' },
            ]}
        />
    ),
};

/** Compound API for full JSX control. */
export const Compound: Story = {
    render: () => (
        <Breadcrumb separator="/">
            <Breadcrumb.List>
                <Breadcrumb.Item>
                    <Breadcrumb.Link href="/">Home</Breadcrumb.Link>
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    <Breadcrumb.Link href="/docs">Docs</Breadcrumb.Link>
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    <Breadcrumb.Page>Breadcrumb</Breadcrumb.Page>
                </Breadcrumb.Item>
            </Breadcrumb.List>
        </Breadcrumb>
    ),
};

/** RTL flips the chevron and the start/end anchoring. */
export const RTL: Story = {
    render: () => (
        <Breadcrumb
            dir="rtl"
            items={[{ label: 'الرئيسية', href: '/' }, { label: 'الوثائق', href: '/docs' }, { label: 'صفحة' }]}
        />
    ),
};
