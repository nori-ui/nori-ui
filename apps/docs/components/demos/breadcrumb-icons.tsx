import { Breadcrumb } from '@nori-ui/core';

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

export default function BreadcrumbIcons() {
    return (
        <Breadcrumb
            items={[
                { label: 'Home', href: '/', icon: HomeIcon },
                { label: 'Programs', href: '/programs', icon: FolderIcon },
                { label: 'Files', href: '/programs/files', icon: FolderIcon },
                { label: 'Services', href: '/programs/files/services', icon: FolderIcon },
                { label: 'config.txt', icon: FileIcon },
            ]}
        />
    );
}
