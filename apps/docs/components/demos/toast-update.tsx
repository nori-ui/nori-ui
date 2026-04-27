'use client';

import { Button, Toaster, toast } from '@nori-ui/core';

export default function ToastUpdate() {
    // Reusing the same `id` lets us swap a loading toast in place for a
    // success/error toast without creating a second card. Useful for any
    // long-running flow that doesn't fit `toast.promise` cleanly (e.g.
    // chained API calls with intermediate progress states).
    return (
        <>
            <Button
                onPress={() => {
                    const id = 'sync-job';
                    toast('Syncing…', { id, duration: Number.POSITIVE_INFINITY });
                    setTimeout(() => {
                        toast.success('Synced 42 records', { id });
                    }, 1500);
                }}
            >
                Run sync
            </Button>
            <Toaster />
        </>
    );
}
