'use client';

import { Button, Toaster, type ToasterPosition, toast, VStack } from '@nori-ui/core';
import { useState } from 'react';

const POSITIONS: ToasterPosition[] = [
    'top-left',
    'top-center',
    'top-right',
    'bottom-left',
    'bottom-center',
    'bottom-right',
];

export default function ToastPositions() {
    const [position, setPosition] = useState<ToasterPosition>('bottom-right');
    return (
        <VStack gap={3}>
            <VStack gap={2}>
                {POSITIONS.map((p) => (
                    <Button
                        key={p}
                        variant={p === position ? 'primary' : 'secondary'}
                        onPress={() => {
                            setPosition(p);
                            toast(`Anchored to ${p}`);
                        }}
                    >
                        {p}
                    </Button>
                ))}
            </VStack>
            <Toaster position={position} />
        </VStack>
    );
}
