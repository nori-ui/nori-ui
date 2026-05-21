'use client';

import { Button, Sheet } from '@nori-ui/core';

export default function SheetSidePanel() {
    return (
        <Sheet side="right" size="md">
            <Sheet.Trigger>
                <Button>Open side panel</Button>
            </Sheet.Trigger>
            <Sheet.Panel>
                <Sheet.Header>
                    <Sheet.Title>Settings</Sheet.Title>
                    <Sheet.Description>Manage your account preferences.</Sheet.Description>
                </Sheet.Header>
                <Sheet.Body />
                <Sheet.Footer>
                    <Sheet.Close>
                        <Button variant="secondary">Cancel</Button>
                    </Sheet.Close>
                    <Sheet.Close>
                        <Button>Save</Button>
                    </Sheet.Close>
                </Sheet.Footer>
            </Sheet.Panel>
        </Sheet>
    );
}
