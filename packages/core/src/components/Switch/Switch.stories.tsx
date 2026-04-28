import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Switch } from './Switch';

const meta: Meta<typeof Switch> = {
    title: 'Controls/Switch',
    component: Switch,
    args: { label: 'Dark mode' },
};
export default meta;
type Story = StoryObj<typeof Switch>;

function Interactive({ initial }: { initial: boolean }) {
    const [checked, setChecked] = useState(initial);
    return <Switch label="Dark mode" checked={checked} onChange={setChecked} />;
}

export const Default: Story = { render: () => <Interactive initial={false} /> };
export const Checked: Story = { render: () => <Interactive initial={true} /> };
export const Disabled: Story = { args: { disabled: true } };
