import { Button, HStack, Tooltip, TooltipContent, TooltipTrigger, VStack } from '@nori-ui/core';

export default function TooltipSides() {
    return (
        <VStack gap={4} className="items-center py-12">
            <Tooltip>
                <TooltipTrigger>
                    <Button variant="secondary">Top</Button>
                </TooltipTrigger>
                <TooltipContent side="top">Tooltip on top</TooltipContent>
            </Tooltip>
            <HStack gap={4}>
                <Tooltip>
                    <TooltipTrigger>
                        <Button variant="secondary">Left</Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">Tooltip on left</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger>
                        <Button variant="secondary">Right</Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Tooltip on right</TooltipContent>
                </Tooltip>
            </HStack>
            <Tooltip>
                <TooltipTrigger>
                    <Button variant="secondary">Bottom</Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Tooltip on bottom</TooltipContent>
            </Tooltip>
        </VStack>
    );
}
