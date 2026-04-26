import { Badge, HStack, VStack } from '@nori-ui/core';

export default function BadgeBasic() {
    return (
        <VStack gap={3}>
            <HStack gap={2} align="center">
                <Badge>Neutral</Badge>
                <Badge tone="primary">Primary</Badge>
                <Badge tone="success">Active</Badge>
                <Badge tone="warning">Pending</Badge>
                <Badge tone="danger">Failed</Badge>
            </HStack>
            <HStack gap={2} align="center">
                <Badge appearance="solid">Solid</Badge>
                <Badge appearance="outline" tone="primary">
                    Outline
                </Badge>
                <Badge tone="success">Soft</Badge>
            </HStack>
        </VStack>
    );
}
