import type { Meta, StoryObj } from '@storybook/react';
import { Spinner } from './Spinner';

const meta: Meta<typeof Spinner> = {
    title: 'Feedback/Spinner',
    component: Spinner,
    args: { size: 'md', label: 'Loading' },
    argTypes: {
        size: { control: 'select', options: ['sm', 'md', 'lg', 'xl'] },
    },
};
export default meta;

export const Default: StoryObj<typeof Spinner> = {};
export const Large: StoryObj<typeof Spinner> = { args: { size: 'lg' } };
export const CustomLabel: StoryObj<typeof Spinner> = { args: { label: 'Fetching results' } };
