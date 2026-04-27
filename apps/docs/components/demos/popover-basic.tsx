import { Button, Popover, PopoverContent, PopoverTrigger, Text, VStack } from '@nori-ui/core';

export default function PopoverBasic() {
    return (
        <Popover>
            <PopoverTrigger>
                <Button variant="secondary">What is this?</Button>
            </PopoverTrigger>
            <PopoverContent side="bottom" align="start" aria-label="Help">
                <VStack gap={2}>
                    <Text variant="body-md" className="font-semibold">
                        Project archive
                    </Text>
                    <Text variant="body-sm" className="text-semantic-text-muted">
                        Archived projects are hidden from your dashboard but kept on your account. You can restore them
                        any time from Settings.
                    </Text>
                </VStack>
            </PopoverContent>
        </Popover>
    );
}
