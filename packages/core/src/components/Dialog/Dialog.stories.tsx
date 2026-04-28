import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from './Dialog';

const meta: Meta<typeof Dialog> = {
    title: 'Overlays/Dialog',
    component: Dialog,
};
export default meta;
type Story = StoryObj<typeof Dialog>;

export const Confirm: Story = {
    render: () => (
        <Dialog>
            <DialogTrigger>
                <Button>Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Delete project?</DialogTitle>
                <DialogDescription>
                    This permanently removes the project and every record attached to it. This cannot be undone.
                </DialogDescription>
                <DialogFooter>
                    <DialogClose>
                        <Button variant="secondary">Cancel</Button>
                    </DialogClose>
                    <DialogClose>
                        <Button variant="destructive">Delete project</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    ),
};
