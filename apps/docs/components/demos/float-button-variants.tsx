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

export default function FloatButtonVariants() {
    return (
        <View style={{ position: 'relative', height: 200, padding: 16 }}>
            <FloatButton
                variant="primary"
                icon={<PlusIcon />}
                accessibilityLabel="primary"
                positioning="absolute"
                placement="bottom-left"
                offset={{ x: 16, y: 16 }}
            />
            <FloatButton
                variant="secondary"
                icon={<PlusIcon />}
                accessibilityLabel="secondary"
                positioning="absolute"
                placement="bottom-left"
                offset={{ x: 88, y: 16 }}
            />
            <FloatButton
                variant="tertiary"
                icon={<PlusIcon />}
                accessibilityLabel="tertiary"
                positioning="absolute"
                placement="bottom-left"
                offset={{ x: 160, y: 16 }}
            />
            <FloatButton
                variant="surface"
                icon={<PlusIcon />}
                accessibilityLabel="surface"
                positioning="absolute"
                placement="bottom-left"
                offset={{ x: 232, y: 16 }}
            />
        </View>
    );
}
