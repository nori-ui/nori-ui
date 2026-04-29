import type { Meta, StoryObj } from '@storybook/react';
import { Text } from '../Text';
import { VStack } from '../VStack';
import { Breadcrumb } from './Breadcrumb';

const meta: Meta<typeof Breadcrumb> = {
    title: 'Navigation/Breadcrumb',
    component: Breadcrumb,
};
export default meta;
type Story = StoryObj<typeof Breadcrumb>;

const HomeIcon = ({ size = 14, color }: { size?: number; color?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color ?? 'currentColor'}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        role="img"
        aria-label="Home"
    >
        <title>Home</title>
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);

const FolderIcon = ({ size = 14, color }: { size?: number; color?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color ?? 'currentColor'}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        role="img"
        aria-label="Folder"
    >
        <title>Folder</title>
        <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" />
    </svg>
);

const FileIcon = ({ size = 14, color }: { size?: number; color?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color ?? 'currentColor'}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        role="img"
        aria-label="File"
    >
        <title>File</title>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
    </svg>
);

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
 */
export const WidthCollapse: Story = {
    render: () => (
        <VStack gap={2}>
            <Text>Try resizing the canvas — the trail collapses to fit.</Text>
            <div
                style={{
                    resize: 'horizontal',
                    overflow: 'hidden',
                    maxWidth: 600,
                    minWidth: 200,
                    border: '1px dashed #ccc',
                    padding: 8,
                }}
            >
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
            </div>
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
