import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogTrigger,
    Button,
} from '@nori-ui/core';

export default function AlertDialogDestructive() {
    return (
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
                    <AlertDialogAction
                        onPress={() => {
                            // Run your destructive side effect here.
                            // The dialog closes automatically afterward.
                        }}
                    >
                        <Button variant="destructive">Yes, delete</Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
