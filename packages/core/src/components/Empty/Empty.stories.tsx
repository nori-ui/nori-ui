import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button';
import { Empty } from './Empty';

const meta: Meta<typeof Empty> = {
    title: 'Display/Empty',
    component: Empty,
};
export default meta;
type Story = StoryObj<typeof Empty>;

export const TitleOnly: Story = {
    render: () => <Empty title="No results found" />,
};

export const WithDescription: Story = {
    render: () => (
        <Empty
            title="No results found"
            description="Try adjusting your search or filters to find what you're looking for."
        />
    ),
};

export const WithAction: Story = {
    render: () => (
        <Empty
            title="Your inbox is empty"
            description="Messages from your team will appear here."
            action={<Button variant="secondary">Refresh</Button>}
        />
    ),
};
