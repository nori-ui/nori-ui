import { AlertDialog, Button } from '@nori-ui/core';

export default function AlertDialogDestructive() {
    return (
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
                    <AlertDialog.Action
                        onPress={() => {
                            // Run your destructive side effect here.
                            // The dialog closes automatically afterward.
                        }}
                    >
                        <Button variant="destructive">Yes, delete</Button>
                    </AlertDialog.Action>
                </AlertDialog.Footer>
            </AlertDialog.Content>
        </AlertDialog>
    );
}
