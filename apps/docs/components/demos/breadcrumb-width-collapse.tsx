import { Breadcrumb, Text, VStack } from '@nori-ui/core';

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

export default function BreadcrumbWidthCollapse() {
    return (
        <VStack gap={3}>
            <Text>Drag the bottom-right corner to resize — middle items collapse to fit.</Text>
            <div
                style={{
                    resize: 'horizontal',
                    overflow: 'hidden',
                    maxWidth: 700,
                    minWidth: 200,
                    border: '1px dashed var(--color-fd-muted-foreground)',
                    padding: 12,
                    borderRadius: 8,
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
                        { label: 'configuration.txt' },
                    ]}
                />
            </div>
        </VStack>
    );
}
