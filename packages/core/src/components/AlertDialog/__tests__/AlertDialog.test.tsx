import { fireEvent, render, screen } from '@testing-library/react';
import { Button } from '../../Button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '../AlertDialog';

/**
 * AlertDialog is a stricter sibling of Dialog: it MUST NOT close on Escape
 * or backdrop click. The user has to press Cancel or Action. Tests below
 * pin those contracts plus the standard accessibility / focus behaviour.
 */
describe('<AlertDialog>', () => {
    it('starts closed when defaultOpen is omitted', () => {
        render(
            <AlertDialog>
                <AlertDialogTrigger asChild={false}>Open</AlertDialogTrigger>
                <AlertDialogContent testID="dialog">
                    <AlertDialogTitle>Hi</AlertDialogTitle>
                </AlertDialogContent>
            </AlertDialog>
        );
        expect(screen.queryByTestId('dialog')).toBeNull();
    });

    it('opens when the trigger is clicked', () => {
        render(
            <AlertDialog>
                <AlertDialogTrigger>
                    <Button testID="trigger">Open</Button>
                </AlertDialogTrigger>
                <AlertDialogContent testID="dialog">
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                </AlertDialogContent>
            </AlertDialog>
        );
        fireEvent.click(screen.getByTestId('trigger'));
        expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    it('AlertDialogCancel fires onPress and closes the dialog', () => {
        const onCancel = jest.fn();
        const onOpenChange = jest.fn();
        render(
            <AlertDialog defaultOpen onOpenChange={onOpenChange}>
                <AlertDialogContent testID="dialog">
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogFooter>
                        <AlertDialogCancel onPress={onCancel}>
                            <Button testID="cancel" variant="secondary">
                                Cancel
                            </Button>
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        );
        fireEvent.click(screen.getByTestId('cancel'));
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onOpenChange).toHaveBeenCalledWith(false);
        expect(screen.queryByTestId('dialog')).toBeNull();
    });

    it('AlertDialogAction fires onPress and closes the dialog', () => {
        const onConfirm = jest.fn();
        const onOpenChange = jest.fn();
        render(
            <AlertDialog defaultOpen onOpenChange={onOpenChange}>
                <AlertDialogContent testID="dialog">
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            <Button variant="secondary">Cancel</Button>
                        </AlertDialogCancel>
                        <AlertDialogAction onPress={onConfirm}>
                            <Button testID="action" variant="destructive">
                                Delete
                            </Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        );
        fireEvent.click(screen.getByTestId('action'));
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onOpenChange).toHaveBeenCalledWith(false);
        expect(screen.queryByTestId('dialog')).toBeNull();
    });

    it('does NOT close when Escape is pressed (alert dialog contract)', () => {
        const onOpenChange = jest.fn();
        render(
            <AlertDialog defaultOpen onOpenChange={onOpenChange}>
                <AlertDialogContent testID="dialog">
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            <Button variant="secondary">Cancel</Button>
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        );
        expect(screen.getByTestId('dialog')).toBeInTheDocument();
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(screen.getByTestId('dialog')).toBeInTheDocument();
        expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('does NOT close when the backdrop is clicked (alert dialog contract)', () => {
        const onOpenChange = jest.fn();
        render(
            <AlertDialog defaultOpen onOpenChange={onOpenChange}>
                <AlertDialogContent testID="dialog">
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            <Button variant="secondary">Cancel</Button>
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        );
        const dialog = screen.getByTestId('dialog');
        // The overlay is the dialog's parent <View>. Click it directly.
        const overlay = dialog.parentElement;
        expect(overlay).not.toBeNull();
        if (overlay) fireEvent.click(overlay);
        expect(screen.getByTestId('dialog')).toBeInTheDocument();
        expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('initial focus lands on the Cancel button', () => {
        render(
            <AlertDialog defaultOpen>
                <AlertDialogContent>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            <Button testID="cancel" variant="secondary">
                                Cancel
                            </Button>
                        </AlertDialogCancel>
                        <AlertDialogAction>
                            <Button testID="action" variant="destructive">
                                Delete
                            </Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        );
        // The Slot wraps the Button; the focused element is the underlying
        // Pressable rendered by Button. Cancel's Slot was rendered first
        // and should hold focus.
        expect(document.activeElement).toBe(screen.getByTestId('cancel'));
    });

    it('traps Tab focus inside the content (Tab from last wraps to first)', () => {
        render(
            <AlertDialog defaultOpen>
                <AlertDialogContent>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            <Button testID="cancel" variant="secondary">
                                Cancel
                            </Button>
                        </AlertDialogCancel>
                        <AlertDialogAction>
                            <Button testID="action" variant="destructive">
                                Delete
                            </Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        );
        const action = screen.getByTestId('action');
        action.focus();
        expect(document.activeElement).toBe(action);
        fireEvent.keyDown(document, { key: 'Tab' });
        // Wrap to first focusable (Cancel).
        expect(document.activeElement).toBe(screen.getByTestId('cancel'));
    });

    it('wires role="alertdialog", aria-modal, aria-labelledby, aria-describedby', () => {
        render(
            <AlertDialog defaultOpen>
                <AlertDialogContent testID="dialog">
                    <AlertDialogTitle>Delete project?</AlertDialogTitle>
                    <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            <Button variant="secondary">Cancel</Button>
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        );
        const dialog = screen.getByTestId('dialog');
        expect(dialog.getAttribute('role')).toBe('alertdialog');
        expect(dialog.getAttribute('aria-modal')).toBe('true');
        const labelledBy = dialog.getAttribute('aria-labelledby');
        const describedBy = dialog.getAttribute('aria-describedby');
        expect(labelledBy).not.toBeNull();
        expect(describedBy).not.toBeNull();
        expect(document.getElementById(labelledBy as string)?.textContent).toBe('Delete project?');
        expect(document.getElementById(describedBy as string)?.textContent).toBe('This cannot be undone.');
    });

    it('throws when AlertDialogContent is rendered outside AlertDialog', () => {
        const original = console.error;
        console.error = () => {};
        try {
            expect(() =>
                render(
                    <AlertDialogContent>
                        <AlertDialogTitle>x</AlertDialogTitle>
                    </AlertDialogContent>
                )
            ).toThrow(/AlertDialog/);
        } finally {
            console.error = original;
        }
    });
});
