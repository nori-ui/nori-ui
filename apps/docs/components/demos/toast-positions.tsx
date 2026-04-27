'use client';

import { Button, type ToasterPosition, toast, VStack } from '@nori-ui/core';

const POSITIONS: ToasterPosition[] = [
    'top-left',
    'top-center',
    'top-right',
    'bottom-left',
    'bottom-center',
    'bottom-right',
];

// Per-call `position` option works the same on web (sonner) and native
// (our viewport reads `toast.position ?? <Toaster position>`). The
// global `<Toaster />` lives in the docs layout; clicking a button
// here just fires a toast anchored to the chosen corner.
export default function ToastPositions() {
    return (
        <VStack gap={2}>
            {POSITIONS.map((position) => (
                <Button
                    key={position}
                    variant="secondary"
                    onPress={() => toast(`Anchored to ${position}`, { position })}
                >
                    {position}
                </Button>
            ))}
        </VStack>
    );
}
