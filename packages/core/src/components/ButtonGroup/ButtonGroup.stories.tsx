import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button';
import { VStack } from '../VStack';
import { ButtonGroup } from './ButtonGroup';

const meta: Meta<typeof ButtonGroup> = {
    title: 'Input/ButtonGroup',
    component: ButtonGroup,
};
export default meta;
type Story = StoryObj<typeof ButtonGroup>;

export const Horizontal: Story = {
    render: () => (
        <ButtonGroup>
            <Button variant="secondary">Day</Button>
            <Button variant="secondary">Week</Button>
            <Button variant="secondary">Month</Button>
        </ButtonGroup>
    ),
};

export const Vertical: Story = {
    render: () => (
        <ButtonGroup orientation="vertical">
            <Button variant="secondary">Top</Button>
            <Button variant="secondary">Middle</Button>
            <Button variant="secondary">Bottom</Button>
        </ButtonGroup>
    ),
};

export const Sizes: Story = {
    render: () => (
        <VStack gap={4}>
            <ButtonGroup size="sm">
                <Button variant="secondary" size="sm">
                    Small
                </Button>
                <Button variant="secondary" size="sm">
                    Group
                </Button>
            </ButtonGroup>
            <ButtonGroup size="lg">
                <Button variant="secondary" size="lg">
                    Large
                </Button>
                <Button variant="secondary" size="lg">
                    Group
                </Button>
            </ButtonGroup>
        </VStack>
    ),
};
