import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './Card';

const meta: Meta<typeof Card> = {
    title: 'Display/Card',
    component: Card,
};
export default meta;
type Story = StoryObj<typeof Card>;

export const Basic: Story = {
    render: () => (
        <Card>
            <CardHeader>
                <CardTitle>Project access</CardTitle>
                <CardDescription>Manage who can view and edit this project.</CardDescription>
            </CardHeader>
            <CardContent>
                Two collaborators currently have access. Add new ones by sending an invite link or assigning a workspace
                role.
            </CardContent>
            <CardFooter>
                <Button variant="ghost">Cancel</Button>
                <Button>Invite</Button>
            </CardFooter>
        </Card>
    ),
};
