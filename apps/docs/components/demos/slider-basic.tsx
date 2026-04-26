'use client';

import { Slider, Text, VStack } from '@nori-ui/core';
import { useState } from 'react';

export default function SliderBasic() {
    const [volume, setVolume] = useState<number[]>([60]);
    const [range, setRange] = useState<number[]>([200, 800]);
    return (
        <VStack gap={5}>
            <VStack gap={2}>
                <Text>Volume — {volume[0]}%</Text>
                <Slider value={volume} onValueChange={setVolume} aria-label="Volume" min={0} max={100} step={1} />
            </VStack>
            <VStack gap={2}>
                <Text>
                    Price — ${range[0]} to ${range[1]}
                </Text>
                <Slider
                    value={range}
                    onValueChange={setRange}
                    min={0}
                    max={1000}
                    step={10}
                    minStepsBetweenThumbs={2}
                    ariaLabelForThumb={(i) => (i === 0 ? 'Minimum price' : 'Maximum price')}
                />
            </VStack>
        </VStack>
    );
}
