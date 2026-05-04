'use client';

import { FloatButton, Text } from '@nori-ui/core';
import { View } from 'react-native';

export default function FloatButtonBackToTop() {
    return (
        <View style={{ position: 'relative', height: 240, padding: 16 }}>
            <Text>
                On a real page, `&lt;FloatButton.BackToTop /&gt;` listens to `window.scrollY` and fades in once you pass
                the `visibilityThreshold` (default 400px). Tap it to smooth-scroll back to the top.
            </Text>
            <FloatButton.BackToTop
                positioning="absolute"
                placement="bottom-right"
                offset={{ x: 16, y: 16 }}
                visibilityThreshold={0}
            />
        </View>
    );
}
