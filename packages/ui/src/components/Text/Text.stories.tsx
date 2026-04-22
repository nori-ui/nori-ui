import type { Meta, StoryObj } from '@storybook/react';
import { Text } from './Text';

const meta: Meta<typeof Text> = {
    title: 'Primitives/Text',
    component: Text,
    argTypes: {
        variant: {
            control: 'select',
            options: ['body-xs', 'body-sm', 'body-md', 'body-lg', 'heading-1', 'heading-2', 'heading-3'],
        },
    },
    args: { children: 'The quick brown fox jumps over the lazy dog.' },
};
export default meta;
type Story = StoryObj<typeof Text>;

export const BodyMd: Story = { args: { variant: 'body-md' } };
export const BodySm: Story = { args: { variant: 'body-sm' } };
export const Heading1: Story = { args: { variant: 'heading-1', children: 'Heading 1' } };
