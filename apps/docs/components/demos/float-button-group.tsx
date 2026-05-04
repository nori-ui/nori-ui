'use client';

import { FloatButton } from '@nori-ui/core';
import { View } from 'react-native';

function PlusIcon({ size = 22 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <title>Plus</title>
            <path d="M12 5v14M5 12h14" />
        </svg>
    );
}
function ChatIcon({ size = 16 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <title>Chat</title>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    );
}
function StarIcon({ size = 16 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <title>Star</title>
            <path d="M12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26z" />
        </svg>
    );
}
function ShareIcon({ size = 16 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <title>Share</title>
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
        </svg>
    );
}

export default function FloatButtonGroupDemo() {
    return (
        <View style={{ position: 'relative', height: 320 }}>
            <FloatButton.Group
                icon={<PlusIcon />}
                accessibilityLabel="More actions"
                positioning="absolute"
                placement="bottom-right"
                offset={{ x: 16, y: 16 }}
            >
                <FloatButton icon={<ChatIcon />} accessibilityLabel="Chat" tooltip="Chat" />
                <FloatButton icon={<StarIcon />} accessibilityLabel="Favorite" tooltip="Favorite" />
                <FloatButton icon={<ShareIcon />} accessibilityLabel="Share" tooltip="Share" />
            </FloatButton.Group>
        </View>
    );
}
