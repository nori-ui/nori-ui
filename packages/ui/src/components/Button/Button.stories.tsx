import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
    title: 'Controls/Button',
    component: Button,
    args: { children: 'Click me', variant: 'primary', size: 'md' },
    argTypes: {
        variant: { control: 'select', options: ['primary', 'secondary', 'ghost', 'destructive'] },
        size: { control: 'select', options: ['sm', 'md', 'lg'] },
    },
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Ghost: Story = { args: { variant: 'ghost' } };
export const Destructive: Story = { args: { variant: 'destructive', children: 'Delete' } };

export const Loading: Story = { args: { loading: true, children: 'Saving' } };
export const Disabled: Story = { args: { disabled: true } };

export const Small: Story = { args: { size: 'sm', children: 'Small' } };
export const Large: Story = { args: { size: 'lg', children: 'Large' } };
