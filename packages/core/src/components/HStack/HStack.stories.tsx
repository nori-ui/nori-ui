import type { Meta, StoryObj } from '@storybook/react';
import { Box } from '../Box';
import { HStack } from './HStack';

const meta: Meta<typeof HStack> = {
    title: 'Primitives/HStack',
    component: HStack,
    render: (args) => (
        <HStack {...args}>
            <Box className="p-2 bg-primary-100">A</Box>
            <Box className="p-2 bg-primary-200">B</Box>
            <Box className="p-2 bg-primary-300">C</Box>
        </HStack>
    ),
};
export default meta;

export const Default: StoryObj<typeof HStack> = {};
export const WithGap: StoryObj<typeof HStack> = { args: { gap: 4 } };
export const Between: StoryObj<typeof HStack> = {
    args: { gap: 2, justify: 'between', className: 'w-full' },
};
