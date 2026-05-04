import { Button, Popover, Text, TextInput, VStack } from '@nori-ui/core';
import { useState } from 'react';

export default function PopoverForm() {
    const [name, setName] = useState('');
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <Popover.Trigger>
                <Button>Rename</Button>
            </Popover.Trigger>
            <Popover.Content side="bottom" align="start" aria-label="Rename project">
                <VStack gap={3}>
                    <Text variant="body-md" className="font-semibold">
                        Rename project
                    </Text>
                    <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="New name"
                        aria-label="New project name"
                    />
                    <Button onPress={() => setOpen(false)}>Save</Button>
                </VStack>
            </Popover.Content>
        </Popover>
    );
}
