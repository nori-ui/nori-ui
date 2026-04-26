'use client';

import { Button, HStack, ToastProvider, useToast } from '@nori-ui/core';

function ToastTriggers() {
    const { toast } = useToast();
    return (
        <HStack gap={2}>
            <Button onPress={() => toast({ title: 'Saved', tone: 'success', description: 'Your changes are live.' })}>
                Show success
            </Button>
            <Button
                variant="destructive"
                onPress={() =>
                    toast({
                        title: 'Build failed',
                        tone: 'danger',
                        description: 'Three checks are blocking the merge.',
                        action: { label: 'View log', onPress: () => undefined },
                    })
                }
            >
                Show error
            </Button>
        </HStack>
    );
}

export default function ToastBasic() {
    return (
        <ToastProvider>
            <ToastTriggers />
        </ToastProvider>
    );
}
