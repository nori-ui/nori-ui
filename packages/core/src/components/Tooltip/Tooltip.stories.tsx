import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button';
import { Tooltip, TooltipContent, TooltipTrigger } from './Tooltip';

const meta: Meta<typeof Tooltip> = {
    title: 'Overlays/Tooltip',
    component: Tooltip,
};
export default meta;
type Story = StoryObj<typeof Tooltip>;

export const OnButton: Story = {
    render: () => (
        <Tooltip>
            <TooltipTrigger>
                <Button variant="secondary">Hover or focus me</Button>
            </TooltipTrigger>
            <TooltipContent side="top">Click to view details</TooltipContent>
        </Tooltip>
    ),
};
