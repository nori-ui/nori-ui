'use client';

import { Button, Toaster, toast } from '@nori-ui/core';

export default function ToastCloseButton() {
    return (
        <>
            <Button
                onPress={() =>
                    toast('Long-running notice', {
                        description: 'Stays open until you dismiss it. The × button is hard-wired.',
                        duration: Number.POSITIVE_INFINITY,
                    })
                }
            >
                Show sticky toast
            </Button>
            <Toaster closeButton duration={Number.POSITIVE_INFINITY} />
        </>
    );
}
