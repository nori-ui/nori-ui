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

function HelpIcon({ size = 22 }: { size?: number }) {
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
            <title>Help</title>
            <path d="M12 17h.01M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        </svg>
    );
}

export default function FloatButtonShapes() {
    return (
        <View
            style={{
                position: 'relative',
                height: 240,
                padding: 16,
                gap: 16,
                flexDirection: 'row',
                alignItems: 'center',
            }}
        >
            <FloatButton
                shape="circle"
                icon={<PlusIcon />}
                accessibilityLabel="Circle"
                positioning="absolute"
                placement="bottom-left"
                offset={{ x: 16, y: 16 }}
            />
            <FloatButton
                shape="square"
                icon={<HelpIcon />}
                accessibilityLabel="Square"
                positioning="absolute"
                placement="bottom-left"
                offset={{ x: 88, y: 16 }}
            />
            <FloatButton
                shape="extended"
                icon={<PlusIcon />}
                label="New project"
                accessibilityLabel="New project"
                positioning="absolute"
                placement="bottom-left"
                offset={{ x: 160, y: 16 }}
            />
        </View>
    );
}
