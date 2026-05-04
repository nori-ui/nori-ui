import { Button, Dialog } from '@nori-ui/core';

export default function DialogBasic() {
    return (
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
    );
}
