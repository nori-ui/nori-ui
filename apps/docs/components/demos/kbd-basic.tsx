import { HStack, Kbd, Text, VStack } from '@nori-ui/core';

export default function KbdBasic() {
    return (
        <VStack gap={4}>
            <HStack gap={2} align="center">
                <Kbd>⌘K</Kbd>
                <Kbd>Ctrl+S</Kbd>
                <Kbd>Shift+?</Kbd>
                <Kbd>Esc</Kbd>
            </HStack>
            <Text variant="body-sm">
                Press <Kbd>⌘K</Kbd> to open the command palette, or <Kbd>Esc</Kbd> to close.
            </Text>
        </VStack>
    );
}
