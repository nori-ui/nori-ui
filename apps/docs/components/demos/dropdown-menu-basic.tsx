'use client';

import { Button, DropdownMenu } from '@nori-ui/core';

export default function DropdownMenuBasic() {
    return (
        <DropdownMenu>
            <DropdownMenu.Trigger>
                <Button variant="secondary">Options</Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
                <DropdownMenu.Label>Actions</DropdownMenu.Label>
                <DropdownMenu.Item onSelect={() => {}}>Edit</DropdownMenu.Item>
                <DropdownMenu.Item onSelect={() => {}}>Duplicate</DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item destructive onSelect={() => {}}>
                    Delete
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu>
    );
}
