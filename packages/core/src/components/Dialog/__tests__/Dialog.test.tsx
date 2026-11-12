import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Button } from '../../Button';
import { DropdownMenu } from '../../DropdownMenu';
import { Dialog } from '../Dialog';

describe('<Dialog>', () => {
    it('starts closed when defaultOpen is omitted', () => {
        render(
            <Dialog>
                <Dialog.Trigger asChild={false}>Open</Dialog.Trigger>
                <Dialog.Content testID="dialog">
                    <Dialog.Title>Hi</Dialog.Title>
                </Dialog.Content>
            </Dialog>
        );
        expect(screen.queryByTestId('dialog')).toBeNull();
    });

    it('opens when the trigger is clicked', () => {
        render(
            <Dialog>
                <Dialog.Trigger asChild={false} testID="trigger">
                    Open
                </Dialog.Trigger>
                <Dialog.Content testID="dialog">
                    <Dialog.Title>Hi</Dialog.Title>
                </Dialog.Content>
            </Dialog>
        );
        fireEvent.click(screen.getByTestId('trigger'));
        expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    it('asChild trigger forwards both onClick and onPress so a wrapped Button (Pressable) opens the dialog', () => {
        // Regression: Button's underlying RN Pressable speaks `onPress`, not
        // `onClick`. Forwarding only `onClick` from Slot silently failed to
        // open the dialog when the trigger child was a <Button>.
        render(
            <Dialog>
                <Dialog.Trigger>
                    <Button testID="trigger">Open</Button>
                </Dialog.Trigger>
                <Dialog.Content testID="dialog">
                    <Dialog.Title>Hi</Dialog.Title>
                </Dialog.Content>
            </Dialog>
        );
        fireEvent.click(screen.getByTestId('trigger'));
        expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    it('asChild close forwards both onClick and onPress so a wrapped Button (Pressable) dismisses', () => {
        render(
            <Dialog defaultOpen>
                <Dialog.Content testID="dialog">
                    <Dialog.Title>Hi</Dialog.Title>
                    <Dialog.Close>
                        <Button testID="close">Close</Button>
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog>
        );
        fireEvent.click(screen.getByTestId('close'));
        expect(screen.queryByTestId('dialog')).toBeNull();
    });

    it('renders defaultOpen state immediately', () => {
        render(
            <Dialog defaultOpen>
                <Dialog.Content testID="dialog">
                    <Dialog.Title>Hi</Dialog.Title>
                </Dialog.Content>
            </Dialog>
        );
        expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    it('controlled: parent state drives open', () => {
        const Wrapper = () => {
            const [open, setOpen] = useState(true);
            return (
                <>
                    <button type="button" data-testid="external" onClick={() => setOpen(false)}>
                        close-from-outside
                    </button>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <Dialog.Content testID="dialog">
                            <Dialog.Title>Hi</Dialog.Title>
                        </Dialog.Content>
                    </Dialog>
                </>
            );
        };
        render(<Wrapper />);
        expect(screen.getByTestId('dialog')).toBeInTheDocument();
        fireEvent.click(screen.getByTestId('external'));
        expect(screen.queryByTestId('dialog')).toBeNull();
    });

    it('Escape closes the dialog', () => {
        render(
            <Dialog defaultOpen>
                <Dialog.Content testID="dialog">
                    <Dialog.Title>Hi</Dialog.Title>
                </Dialog.Content>
            </Dialog>
        );
        expect(screen.getByTestId('dialog')).toBeInTheDocument();
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(screen.queryByTestId('dialog')).toBeNull();
    });

    it('DialogClose triggers onOpenChange and dismisses', () => {
        const onOpenChange = jest.fn();
        render(
            <Dialog defaultOpen onOpenChange={onOpenChange}>
                <Dialog.Content>
                    <Dialog.Title>Hi</Dialog.Title>
                    <Dialog.Close asChild={false} testID="close">
                        Done
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog>
        );
        fireEvent.click(screen.getByTestId('close'));
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('locks body scroll while open and restores on close', () => {
        const { rerender } = render(
            <Dialog open>
                <Dialog.Content testID="dialog">
                    <Dialog.Title>Hi</Dialog.Title>
                </Dialog.Content>
            </Dialog>
        );
        expect(document.body.style.overflow).toBe('hidden');
        rerender(
            <Dialog open={false}>
                <Dialog.Content testID="dialog">
                    <Dialog.Title>Hi</Dialog.Title>
                </Dialog.Content>
            </Dialog>
        );
        expect(document.body.style.overflow).toBe('');
    });

    it('wires aria-labelledby and aria-describedby to title and description', () => {
        render(
            <Dialog defaultOpen>
                <Dialog.Content testID="dialog">
                    <Dialog.Title>The title</Dialog.Title>
                    <Dialog.Description>Some context</Dialog.Description>
                </Dialog.Content>
            </Dialog>
        );
        const dialog = screen.getByTestId('dialog');
        const labelledBy = dialog.getAttribute('aria-labelledby');
        const describedBy = dialog.getAttribute('aria-describedby');
        expect(labelledBy).not.toBeNull();
        expect(describedBy).not.toBeNull();
        expect(document.getElementById(labelledBy as string)?.textContent).toBe('The title');
        expect(document.getElementById(describedBy as string)?.textContent).toBe('Some context');
    });

    it('asChild trigger calls the wrapped child handler exactly once', () => {
        const onPress = jest.fn();
        render(
            <Dialog>
                <Dialog.Trigger>
                    <Button testID="trigger" onPress={onPress}>
                        Open
                    </Button>
                </Dialog.Trigger>
                <Dialog.Content testID="dialog">
                    <Dialog.Title>Hi</Dialog.Title>
                </Dialog.Content>
            </Dialog>
        );
        fireEvent.click(screen.getByTestId('trigger'));
        expect(onPress).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    it('keeps focus in a form field when the parent re-renders with an inline onOpenChange', () => {
        const Form = () => {
            const [value, setValue] = useState('');
            return (
                <Dialog open onOpenChange={() => {}}>
                    <Dialog.Content>
                        <Dialog.Title>Edit</Dialog.Title>
                        <button type="button">First</button>
                        <input data-testid="field" value={value} onChange={(event) => setValue(event.target.value)} />
                    </Dialog.Content>
                </Dialog>
            );
        };
        render(<Form />);
        const field = screen.getByTestId('field');
        field.focus();
        fireEvent.change(field, { target: { value: 'a' } });
        expect(document.activeElement).toBe(field);
    });

    it('Escape closes only the topmost layer when a menu is open inside the dialog', () => {
        render(
            <Dialog defaultOpen>
                <Dialog.Content testID="dialog">
                    <Dialog.Title>Hi</Dialog.Title>
                    <DropdownMenu>
                        <DropdownMenu.Trigger>
                            <button type="button">Options</button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content>
                            <DropdownMenu.Item>Edit</DropdownMenu.Item>
                        </DropdownMenu.Content>
                    </DropdownMenu>
                </Dialog.Content>
            </Dialog>
        );
        fireEvent.click(screen.getByRole('button', { name: 'Options' }));
        expect(screen.getByRole('menu')).toBeInTheDocument();

        fireEvent.keyDown(document, { key: 'Escape' });
        expect(screen.queryByRole('menu')).toBeNull();
        expect(screen.getByTestId('dialog')).toBeInTheDocument();

        fireEvent.keyDown(document, { key: 'Escape' });
        expect(screen.queryByTestId('dialog')).toBeNull();
    });

    it('does not hide the dialog from assistive tech behind an aria-hidden ancestor', () => {
        render(
            <Dialog defaultOpen>
                <Dialog.Content testID="dialog">
                    <Dialog.Title>Hi</Dialog.Title>
                </Dialog.Content>
            </Dialog>
        );
        expect(screen.getByTestId('dialog').closest('[aria-hidden="true"]')).toBeNull();
    });

    it('emits no dangling aria-labelledby without a title and accepts aria-label instead', () => {
        render(
            <Dialog defaultOpen>
                <Dialog.Content testID="dialog" aria-label="Settings">
                    <button type="button">Ok</button>
                </Dialog.Content>
            </Dialog>
        );
        const dialog = screen.getByTestId('dialog');
        expect(dialog).not.toHaveAttribute('aria-labelledby');
        expect(dialog).not.toHaveAttribute('aria-describedby');
        expect(dialog).toHaveAttribute('aria-label', 'Settings');
    });

    it('a close button with visible text is named by that text, an icon-only one by the fallback label', () => {
        render(
            <Dialog defaultOpen>
                <Dialog.Content>
                    <Dialog.Title>Hi</Dialog.Title>
                    <Dialog.Close asChild={false} testID="text-close">
                        Cancel
                    </Dialog.Close>
                    <Dialog.Close asChild={false} testID="icon-close" />
                </Dialog.Content>
            </Dialog>
        );
        expect(screen.getByTestId('text-close')).not.toHaveAttribute('aria-label');
        expect(screen.getByTestId('icon-close')).toHaveAttribute('aria-label', 'Close');
    });

    it('throws when DialogContent is rendered outside Dialog', () => {
        const original = console.error;
        console.error = () => {};
        try {
            expect(() =>
                render(
                    <Dialog.Content>
                        <Dialog.Title>x</Dialog.Title>
                    </Dialog.Content>
                )
            ).toThrow(/Dialog/);
        } finally {
            console.error = original;
        }
    });
});
