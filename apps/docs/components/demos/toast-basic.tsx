'use client';

import { Button, HStack, Toaster, toast, VStack } from '@nori-ui/core';

export default function ToastBasic() {
    return (
        <VStack gap={3}>
            <HStack gap={2}>
                <Button variant="secondary" onPress={() => toast('Build queued')}>
                    Default
                </Button>
                <Button
                    variant="secondary"
                    onPress={() => toast.info('Heads up', { description: 'A new version is available.' })}
                >
                    Info
                </Button>
                <Button
                    variant="secondary"
                    onPress={() => toast.success('Saved', { description: 'Your changes are live.' })}
                >
                    Success
                </Button>
                <Button
                    variant="secondary"
                    onPress={() =>
                        toast.warning('Almost out of space', {
                            description: '92% of your storage quota is in use.',
                        })
                    }
                >
                    Warning
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
                    Error
                </Button>
            </HStack>
            <HStack gap={2}>
                <Button
                    variant="ghost"
                    onPress={() =>
                        toast('Item moved to trash', {
                            action: { label: 'Undo', onClick: () => toast.success('Restored') },
                        })
                    }
                >
                    With action
                </Button>
                <Button
                    variant="ghost"
                    onPress={() => {
                        const promise = new Promise<{ name: string }>((resolve) =>
                            setTimeout(() => resolve({ name: 'invoice-042.pdf' }), 1500)
                        );
                        toast.promise(promise, {
                            loading: 'Uploading…',
                            success: (data) => `${data.name} uploaded`,
                            error: 'Upload failed',
                        });
                    }}
                >
                    Promise
                </Button>
                <Button variant="ghost" onPress={() => toast.dismiss()}>
                    Dismiss all
                </Button>
            </HStack>
            <Toaster />
        </VStack>
    );
}
