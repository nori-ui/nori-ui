import type { Meta, StoryObj } from '@storybook/react';
import { Box } from '../Box';
import { VStack } from './VStack';

const meta: Meta<typeof VStack> = {
    title: 'Primitives/VStack',
    component: VStack,
    render: (args) => (
        <VStack {...args}>
            <Box className="p-2 bg-primary-100">A</Box>
            <Box className="p-2 bg-primary-200">B</Box>
            <Box className="p-2 bg-primary-300">C</Box>
        </VStack>
    ),
};
export default meta;

export const Default: StoryObj<typeof VStack> = {};
export const WithGap: StoryObj<typeof VStack> = { args: { gap: 4 } };
