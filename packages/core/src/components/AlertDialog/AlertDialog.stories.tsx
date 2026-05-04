import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button';
import { AlertDialog } from './AlertDialog';

const meta: Meta<typeof AlertDialog> = {
    title: 'Overlays/AlertDialog',
    component: AlertDialog,
};
export default meta;
type Story = StoryObj<typeof AlertDialog>;

export const Destructive: Story = {
    render: () => (
        <AlertDialog>
            <AlertDialog.Trigger>
                <Button variant="destructive">Delete account</Button>
            </AlertDialog.Trigger>
            <AlertDialog.Content>
                <AlertDialog.Title>Delete your account?</AlertDialog.Title>
                <AlertDialog.Description>
                    This permanently deletes your account, every project you own, and all associated data. This action
                    cannot be undone.
                </AlertDialog.Description>
                <AlertDialog.Footer>
                    <AlertDialog.Cancel>
                        <Button variant="secondary">Cancel</Button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action>
                        <Button variant="destructive">Yes, delete</Button>
                    </AlertDialog.Action>
                </AlertDialog.Footer>
            </AlertDialog.Content>
        </AlertDialog>
    ),
};
