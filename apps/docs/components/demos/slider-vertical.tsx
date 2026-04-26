'use client';

import { Box, HStack, Slider, Text, VStack } from '@nori-ui/core';
import { useState } from 'react';

export default function SliderVertical() {
    const [bass, setBass] = useState<number[]>([60]);
    const [mids, setMids] = useState<number[]>([45]);
    const [treble, setTreble] = useState<number[]>([70]);
    return (
        <HStack gap={6} align="end">
            <VStack gap={2} align="center">
                <Slider orientation="vertical" length={140} value={bass} onValueChange={setBass} aria-label="Bass" />
                <Box>
                    <Text>Bass {bass[0]}</Text>
                </Box>
            </VStack>
            <VStack gap={2} align="center">
                <Slider orientation="vertical" length={140} value={mids} onValueChange={setMids} aria-label="Mids" />
                <Text>Mids {mids[0]}</Text>
            </VStack>
            <VStack gap={2} align="center">
                <Slider
                    orientation="vertical"
                    length={140}
                    value={treble}
                    onValueChange={setTreble}
                    aria-label="Treble"
                />
                <Text>Treble {treble[0]}</Text>
            </VStack>
        </HStack>
    );
}
