import { HStack, Separator, Text } from '@nori-ui/core';

/**
 * Vertical separator inside an HStack — useful for inline rules
 * between linked actions in a header row, breadcrumb segments, or
 * inline metadata. The Separator stretches to its container's height
 * via `align-self: stretch` (default), so it picks up whatever line
 * height the surrounding text sets.
 */
export default function SeparatorVertical() {
    return (
        <HStack gap={3} className="items-center">
            <Text>Edit</Text>
            <Separator orientation="vertical" />
            <Text>Duplicate</Text>
            <Separator orientation="vertical" />
            <Text>Delete</Text>
        </HStack>
    );
}
