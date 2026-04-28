import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Toggle } from './Toggle';

const meta: Meta<typeof Toggle> = {
    title: 'Controls/Toggle',
    component: Toggle,
};
export default meta;
type Story = StoryObj<typeof Toggle>;

function PinToggle() {
    const [pinned, setPinned] = useState(false);
    return (
        <Toggle pressed={pinned} onPressedChange={setPinned} aria-label="Pin to top">
            {pinned ? 'Pinned' : 'Pin to top'}
        </Toggle>
    );
}

export const Basic: Story = { render: () => <PinToggle /> };
