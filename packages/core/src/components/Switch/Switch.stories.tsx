import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Field } from '../Field';
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

export const InsideField: Story = {
    render: () => (
        <Field label="Notifications" description="Choose how you'd like to be notified.">
            <Switch label="Email digests" />
        </Field>
    ),
};

export const InsideFieldWithError: Story = {
    render: () => (
        <Field label="Notifications" error="This setting is required.">
            <Switch label="Email digests" />
        </Field>
    ),
};
