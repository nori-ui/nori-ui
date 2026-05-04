'use client';

import { Slider, Text, VStack } from '@nori-ui/core';
import { useState } from 'react';

export default function SliderMulti() {
    // Multi-thumb pickers — useful for "split into N regions" controls,
    // e.g. histogram bucket boundaries, equalizer band crossovers, color
    // gradient stops.
    const [stops, setStops] = useState<number[]>([20, 50, 80]);
    return (
        <VStack gap={3}>
            <Text>Gradient stops — {stops.join(', ')}</Text>
            <Slider
                value={stops}
                onChange={setStops}
                min={0}
                max={100}
                step={1}
                minStepsBetweenThumbs={5}
                ariaLabelForThumb={(i) => `Stop ${i + 1}`}
            />
        </VStack>
    );
}
