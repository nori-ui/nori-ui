import { Breadcrumb, Text, VStack } from '@nori-ui/core';

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

export default function BreadcrumbSiblingMenu() {
    return (
        <VStack gap={3}>
            <Text>Click the small arrow next to "Programs" to jump to a sibling folder.</Text>
            <Breadcrumb
                items={[
                    { label: 'Home', href: '/' },
                    {
                        label: 'Programs',
                        href: '/programs',
                        icon: FolderIcon,
                        siblings: [
                            { label: 'Documents', href: '/documents', icon: FolderIcon },
                            { label: 'Downloads', href: '/downloads', icon: FolderIcon },
                            { label: 'Music', href: '/music', icon: FolderIcon },
                            { label: 'Pictures', href: '/pictures', icon: FolderIcon },
                        ],
                    },
                    { label: 'config.txt' },
                ]}
            />
        </VStack>
    );
}
