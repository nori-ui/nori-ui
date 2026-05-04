import { Button, HStack, Tooltip, VStack } from '@nori-ui/core';

export default function TooltipSides() {
    return (
        <VStack gap={4} className="items-center py-12">
            <Tooltip>
                <Tooltip.Trigger>
                    <Button variant="secondary">Top</Button>
                </Tooltip.Trigger>
                <Tooltip.Content side="top">Tooltip on top</Tooltip.Content>
            </Tooltip>
            <HStack gap={4}>
                <Tooltip>
                    <Tooltip.Trigger>
                        <Button variant="secondary">Left</Button>
                    </Tooltip.Trigger>
                    <Tooltip.Content side="left">Tooltip on left</Tooltip.Content>
                </Tooltip>
                <Tooltip>
                    <Tooltip.Trigger>
                        <Button variant="secondary">Right</Button>
                    </Tooltip.Trigger>
                    <Tooltip.Content side="right">Tooltip on right</Tooltip.Content>
                </Tooltip>
            </HStack>
            <Tooltip>
                <Tooltip.Trigger>
                    <Button variant="secondary">Bottom</Button>
                </Tooltip.Trigger>
                <Tooltip.Content side="bottom">Tooltip on bottom</Tooltip.Content>
            </Tooltip>
        </VStack>
    );
}
