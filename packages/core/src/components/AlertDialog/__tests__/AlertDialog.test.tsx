import { fireEvent, render, screen } from '@testing-library/react';
import { Button } from '../../Button';
import { AlertDialog } from '../AlertDialog';

/**
 * AlertDialog is a stricter sibling of Dialog: it MUST NOT close on Escape
 * or backdrop click. The user has to press Cancel or Action. Tests below
 * pin those contracts plus the standard accessibility / focus behaviour.
 */
describe('<AlertDialog>', () => {
    it('starts closed when defaultOpen is omitted', () => {
        render(
            <AlertDialog>
                <AlertDialog.Trigger asChild={false}>Open</AlertDialog.Trigger>
                <AlertDialog.Content testID="dialog">
                    <AlertDialog.Title>Hi</AlertDialog.Title>
                </AlertDialog.Content>
            </AlertDialog>
        );
        expect(screen.queryByTestId('dialog')).toBeNull();
    });

    it('opens when the trigger is clicked', () => {
        render(
            <AlertDialog>
                <AlertDialog.Trigger>
                    <Button testID="trigger">Open</Button>
                </AlertDialog.Trigger>
                <AlertDialog.Content testID="dialog">
                    <AlertDialog.Title>Are you sure?</AlertDialog.Title>
                </AlertDialog.Content>
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
                <AlertDialog.Content testID="dialog">
                    <AlertDialog.Title>Are you sure?</AlertDialog.Title>
                    <AlertDialog.Footer>
                        <AlertDialog.Cancel onPress={onCancel}>
                            <Button testID="cancel" variant="secondary">
                                Cancel
                            </Button>
                        </AlertDialog.Cancel>
                    </AlertDialog.Footer>
                </AlertDialog.Content>
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
                <AlertDialog.Content testID="dialog">
                    <AlertDialog.Title>Are you sure?</AlertDialog.Title>
                    <AlertDialog.Footer>
                        <AlertDialog.Cancel>
                            <Button variant="secondary">Cancel</Button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action onPress={onConfirm}>
                            <Button testID="action" variant="destructive">
                                Delete
                            </Button>
                        </AlertDialog.Action>
                    </AlertDialog.Footer>
                </AlertDialog.Content>
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
                <AlertDialog.Content testID="dialog">
                    <AlertDialog.Title>Are you sure?</AlertDialog.Title>
                    <AlertDialog.Footer>
                        <AlertDialog.Cancel>
                            <Button variant="secondary">Cancel</Button>
                        </AlertDialog.Cancel>
                    </AlertDialog.Footer>
                </AlertDialog.Content>
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
                <AlertDialog.Content testID="dialog">
                    <AlertDialog.Title>Are you sure?</AlertDialog.Title>
                    <AlertDialog.Footer>
                        <AlertDialog.Cancel>
                            <Button variant="secondary">Cancel</Button>
                        </AlertDialog.Cancel>
                    </AlertDialog.Footer>
                </AlertDialog.Content>
            </AlertDialog>
        );
        const dialog = screen.getByTestId('dialog');
        // The overlay is the dialog's parent <View>. Click it directly.
        const overlay = dialog.parentElement;
        expect(overlay).not.toBeNull();
        if (overlay) {
            fireEvent.click(overlay);
        }
        expect(screen.getByTestId('dialog')).toBeInTheDocument();
        expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('initial focus lands on the Cancel button', () => {
        render(
            <AlertDialog defaultOpen>
                <AlertDialog.Content>
                    <AlertDialog.Title>Are you sure?</AlertDialog.Title>
                    <AlertDialog.Footer>
                        <AlertDialog.Cancel>
                            <Button testID="cancel" variant="secondary">
                                Cancel
                            </Button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action>
                            <Button testID="action" variant="destructive">
                                Delete
                            </Button>
                        </AlertDialog.Action>
                    </AlertDialog.Footer>
                </AlertDialog.Content>
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
                <AlertDialog.Content>
                    <AlertDialog.Title>Are you sure?</AlertDialog.Title>
                    <AlertDialog.Footer>
                        <AlertDialog.Cancel>
                            <Button testID="cancel" variant="secondary">
                                Cancel
                            </Button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action>
                            <Button testID="action" variant="destructive">
                                Delete
                            </Button>
                        </AlertDialog.Action>
                    </AlertDialog.Footer>
                </AlertDialog.Content>
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
                <AlertDialog.Content testID="dialog">
                    <AlertDialog.Title>Delete project?</AlertDialog.Title>
                    <AlertDialog.Description>This cannot be undone.</AlertDialog.Description>
                    <AlertDialog.Footer>
                        <AlertDialog.Cancel>
                            <Button variant="secondary">Cancel</Button>
                        </AlertDialog.Cancel>
                    </AlertDialog.Footer>
                </AlertDialog.Content>
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
                    <AlertDialog.Content>
                        <AlertDialog.Title>x</AlertDialog.Title>
                    </AlertDialog.Content>
                )
            ).toThrow(/AlertDialog/);
        } finally {
            console.error = original;
        }
    });
});
