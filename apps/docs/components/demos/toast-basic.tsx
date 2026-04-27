'use client';

import { Button, HStack, Toaster, toast } from '@nori-ui/core';

export default function ToastBasic() {
    return (
        <>
            <HStack gap={2}>
                <Button onPress={() => toast.success('Saved', { description: 'Your changes are live.' })}>
                    Show success
                </Button>
                <Button
                    variant="destructive"
                    onPress={() =>
                        toast.error('Build failed', {
                            description: 'Three checks are blocking the merge.',
                            action: { label: 'View log', onClick: () => undefined },
                        })
                    }
                >
                    Show error
                </Button>
            </HStack>
            <Toaster />
        </>
    );
}
