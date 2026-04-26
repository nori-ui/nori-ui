import {
    Button,
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@nori-ui/core';

export default function DialogBasic() {
    return (
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
                        <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                    <DialogClose>
                        <Button variant="destructive">Delete project</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
