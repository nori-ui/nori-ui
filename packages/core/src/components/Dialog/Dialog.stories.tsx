import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button';
import { Dialog } from './Dialog';

const meta: Meta<typeof Dialog> = {
    title: 'Overlays/Dialog',
    component: Dialog,
};
export default meta;
type Story = StoryObj<typeof Dialog>;

export const Confirm: Story = {
    render: () => (
        <Dialog>
            <Dialog.Trigger>
                <Button>Open dialog</Button>
            </Dialog.Trigger>
            <Dialog.Content>
                <Dialog.Title>Delete project?</Dialog.Title>
                <Dialog.Description>
                    This permanently removes the project and every record attached to it. This cannot be undone.
                </Dialog.Description>
                <Dialog.Footer>
                    <Dialog.Close>
                        <Button variant="secondary">Cancel</Button>
                    </Dialog.Close>
                    <Dialog.Close>
                        <Button variant="destructive">Delete project</Button>
                    </Dialog.Close>
                </Dialog.Footer>
            </Dialog.Content>
        </Dialog>
    ),
};
