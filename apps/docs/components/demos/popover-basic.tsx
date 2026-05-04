import { Button, Popover, Text, VStack } from '@nori-ui/core';

export default function PopoverBasic() {
    return (
        <Popover>
            <Popover.Trigger>
                <Button variant="secondary">What is this?</Button>
            </Popover.Trigger>
            <Popover.Content side="bottom" align="start" aria-label="Help">
                <VStack gap={2}>
                    <Text variant="body-md" className="font-semibold">
                        Project archive
                    </Text>
                    <Text variant="body-sm" className="text-semantic-text-muted">
                        Archived projects are hidden from your dashboard but kept on your account. You can restore them
                        any time from Settings.
                    </Text>
                </VStack>
            </Popover.Content>
        </Popover>
    );
}
