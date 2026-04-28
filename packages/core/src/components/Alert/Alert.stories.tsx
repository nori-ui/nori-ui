import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from './Alert';

const meta: Meta<typeof Alert> = {
    title: 'Feedback/Alert',
    component: Alert,
};
export default meta;
type Story = StoryObj<typeof Alert>;

export const Info: Story = {
    args: { tone: 'info', title: 'Heads up', description: 'Your storage limit is approaching.' },
};
export const Success: Story = {
    args: { tone: 'success', title: 'Saved', description: 'Profile changes are live.' },
};
export const Warning: Story = {
    args: {
        tone: 'warning',
        title: 'Action required',
        description: 'Verify your email to keep your account active.',
    },
};
export const Danger: Story = {
    args: { tone: 'danger', title: 'Build failed', description: 'Three checks are blocking the merge.' },
};
