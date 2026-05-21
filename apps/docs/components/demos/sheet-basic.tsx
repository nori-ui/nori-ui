'use client';

import { Button, Sheet } from '@nori-ui/core';

export default function SheetBasic() {
    return (
        <Sheet side="bottom" size="md">
            <Sheet.Trigger>
                <Button>Open sheet</Button>
            </Sheet.Trigger>
            <Sheet.Panel>
                <Sheet.Header>
                    <Sheet.Title>Sheet title</Sheet.Title>
                    <Sheet.Description>This is the sheet description text.</Sheet.Description>
                </Sheet.Header>
                <Sheet.Body />
                <Sheet.Footer>
                    <Sheet.Close>
                        <Button variant="secondary">Cancel</Button>
                    </Sheet.Close>
                    <Sheet.Close>
                        <Button>Done</Button>
                    </Sheet.Close>
                </Sheet.Footer>
            </Sheet.Panel>
        </Sheet>
    );
}
