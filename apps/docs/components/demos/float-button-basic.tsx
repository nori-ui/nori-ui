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

export default function FloatButtonBasic() {
    return (
        <View style={{ position: 'relative', height: 240, overflow: 'hidden', borderRadius: 8 }}>
            <FloatButton
                accessibilityLabel="Add new"
                icon={<PlusIcon />}
                placement="bottom-right"
                positioning="absolute"
                offset={{ x: 16, y: 16 }}
            />
        </View>
    );
}
