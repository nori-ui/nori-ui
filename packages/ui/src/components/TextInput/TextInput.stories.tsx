import type { Meta, StoryObj } from '@storybook/react';
import { TextInput } from './TextInput';

const meta: Meta<typeof TextInput> = {
    title: 'Inputs/TextInput',
    component: TextInput,
    args: { label: 'Email', placeholder: 'you@example.com' },
};
export default meta;
type Story = StoryObj<typeof TextInput>;

export const Default: Story = {};
export const WithHelper: Story = { args: { helperText: "We won't share this." } };
export const WithError: Story = { args: { error: 'Required', value: '' } };
export const Disabled: Story = { args: { disabled: true, value: 'read only' } };
