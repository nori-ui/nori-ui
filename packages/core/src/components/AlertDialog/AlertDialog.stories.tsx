import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogTrigger,
} from './AlertDialog';

const meta: Meta<typeof AlertDialog> = {
    title: 'Overlays/AlertDialog',
    component: AlertDialog,
};
export default meta;
type Story = StoryObj<typeof AlertDialog>;

export const Destructive: Story = {
    render: () => (
        <AlertDialog>
            <AlertDialogTrigger>
                <Button variant="destructive">Delete account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                    This permanently deletes your account, every project you own, and all associated data. This action
                    cannot be undone.
                </AlertDialogDescription>
                <AlertDialogFooter>
                    <AlertDialogCancel>
                        <Button variant="secondary">Cancel</Button>
                    </AlertDialogCancel>
                    <AlertDialogAction>
                        <Button variant="destructive">Yes, delete</Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    ),
};
