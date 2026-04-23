import type { Meta, StoryObj } from '@storybook/react';
import { Box } from './Box';

const meta: Meta<typeof Box> = {
    title: 'Primitives/Box',
    component: Box,
    args: { className: 'p-4 bg-primary-50 rounded-md', children: 'Box content' },
};
export default meta;

export const Default: StoryObj<typeof Box> = {};
