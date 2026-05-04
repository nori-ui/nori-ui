import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button';
import { Card } from './Card';

const meta: Meta<typeof Card> = {
    title: 'Display/Card',
    component: Card,
};
export default meta;
type Story = StoryObj<typeof Card>;

export const Basic: Story = {
    render: () => (
        <Card>
            <Card.Header>
                <Card.Title>Project access</Card.Title>
                <Card.Description>Manage who can view and edit this project.</Card.Description>
            </Card.Header>
            <Card.Content>
                Two collaborators currently have access. Add new ones by sending an invite link or assigning a workspace
                role.
            </Card.Content>
            <Card.Footer>
                <Button variant="ghost">Cancel</Button>
                <Button>Invite</Button>
            </Card.Footer>
        </Card>
    ),
};
