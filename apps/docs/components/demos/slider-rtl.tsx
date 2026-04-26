'use client';

import { Slider, Text, VStack } from '@nori-ui/core';
import { useState } from 'react';

export default function SliderRtl() {
    const [volume, setVolume] = useState<number[]>([60]);
    return (
        <VStack gap={3}>
            <Text>RTL — visually higher value sits on the left, ArrowRight decreases</Text>
            <Slider value={volume} onValueChange={setVolume} dir="rtl" aria-label="Volume" min={0} max={100} step={1} />
            <Text>Value: {volume[0]}</Text>
        </VStack>
    );
}
