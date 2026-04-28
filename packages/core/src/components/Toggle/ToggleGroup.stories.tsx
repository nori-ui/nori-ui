import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from './Toggle';

const meta: Meta<typeof ToggleGroup> = {
    title: 'Controls/ToggleGroup',
    component: ToggleGroup,
};
export default meta;
type Story = StoryObj<typeof ToggleGroup>;

function Alignment() {
    const [align, setAlign] = useState<string | undefined>('left');
    return (
        <ToggleGroup type="single" value={align} onValueChange={setAlign} aria-label="Text alignment">
            <ToggleGroupItem value="left" aria-label="Align left">
                Left
            </ToggleGroupItem>
            <ToggleGroupItem value="center" aria-label="Align center">
                Center
            </ToggleGroupItem>
            <ToggleGroupItem value="right" aria-label="Align right">
                Right
            </ToggleGroupItem>
        </ToggleGroup>
    );
}

export const Single: Story = { render: () => <Alignment /> };
