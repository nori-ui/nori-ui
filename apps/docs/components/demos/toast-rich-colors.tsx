'use client';

import { Button, HStack, Toaster, toast } from '@nori-ui/core';

export default function ToastRichColors() {
    return (
        <>
            <HStack gap={2}>
                <Button variant="secondary" onPress={() => toast.info('New version available')}>
                    Info
                </Button>
                <Button variant="secondary" onPress={() => toast.success('Pushed to main')}>
                    Success
                </Button>
                <Button variant="secondary" onPress={() => toast.warning('Low disk space')}>
                    Warning
                </Button>
                <Button variant="destructive" onPress={() => toast.error('Deploy failed')}>
                    Error
                </Button>
            </HStack>
            <Toaster richColors />
        </>
    );
}
