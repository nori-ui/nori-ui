import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button';
import { Tooltip } from './Tooltip';

const meta: Meta<typeof Tooltip> = {
    title: 'Overlays/Tooltip',
    component: Tooltip,
};
export default meta;
type Story = StoryObj<typeof Tooltip>;

export const OnButton: Story = {
    render: () => (
        <Tooltip>
            <Tooltip.Trigger>
                <Button variant="secondary">Hover or focus me</Button>
            </Tooltip.Trigger>
            <Tooltip.Content side="top">Click to view details</Tooltip.Content>
        </Tooltip>
    ),
};
