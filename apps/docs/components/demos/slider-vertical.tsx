'use client';

import { Box, HStack, Slider, Text, VStack } from '@nori-ui/core';
import { useState } from 'react';

// `tabular-nums` keeps each digit in a fixed-width cell so the readout
// doesn't reflow as the slider value changes — the column under each
// label stays put. Without it, the label drifts horizontally as digits
// of different glyph widths cycle (1 is narrower than 0 in most
// proportional faces) and the layout jiggles.
const NUMERIC_LABEL = { fontVariant: ['tabular-nums' as const] };

export default function SliderVertical() {
    const [bass, setBass] = useState<number[]>([60]);
    const [mids, setMids] = useState<number[]>([45]);
    const [treble, setTreble] = useState<number[]>([70]);
    return (
        <HStack gap={6} align="end">
            <VStack gap={2} align="center">
                <Slider orientation="vertical" length={140} value={bass} onChange={setBass} aria-label="Bass" />
                <Box>
                    <Text style={NUMERIC_LABEL}>Bass {bass[0]}</Text>
                </Box>
            </VStack>
            <VStack gap={2} align="center">
                <Slider orientation="vertical" length={140} value={mids} onChange={setMids} aria-label="Mids" />
                <Text style={NUMERIC_LABEL}>Mids {mids[0]}</Text>
            </VStack>
            <VStack gap={2} align="center">
                <Slider orientation="vertical" length={140} value={treble} onChange={setTreble} aria-label="Treble" />
                <Text style={NUMERIC_LABEL}>Treble {treble[0]}</Text>
            </VStack>
        </HStack>
    );
}
