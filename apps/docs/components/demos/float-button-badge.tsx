'use client';

import { FloatButton } from '@nori-ui/core';
import { View } from 'react-native';

function ChatIcon({ size = 22 }: { size?: number }) {
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

function BellIcon({ size = 22 }: { size?: number }) {
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
            <title>Notifications</title>
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
    );
}

export default function FloatButtonBadge() {
    return (
        <View style={{ position: 'relative', height: 240 }}>
            <FloatButton
                icon={<ChatIcon />}
                accessibilityLabel="Messages"
                badge={{ count: 12 }}
                positioning="absolute"
                placement="bottom-left"
                offset={{ x: 16, y: 16 }}
            />
            <FloatButton
                icon={<BellIcon />}
                accessibilityLabel="Notifications"
                badge={{ dot: true }}
                positioning="absolute"
                placement="bottom-left"
                offset={{ x: 88, y: 16 }}
            />
        </View>
    );
}
