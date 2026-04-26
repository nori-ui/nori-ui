import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '../Dialog';

describe('<Dialog>', () => {
    it('starts closed when defaultOpen is omitted', () => {
        render(
            <Dialog>
                <DialogTrigger asChild={false}>Open</DialogTrigger>
                <DialogContent testID="dialog">
                    <DialogTitle>Hi</DialogTitle>
                </DialogContent>
            </Dialog>
        );
        expect(screen.queryByTestId('dialog')).toBeNull();
    });

    it('opens when the trigger is clicked', () => {
        render(
            <Dialog>
                <DialogTrigger asChild={false} testID="trigger">
                    Open
                </DialogTrigger>
                <DialogContent testID="dialog">
                    <DialogTitle>Hi</DialogTitle>
                </DialogContent>
            </Dialog>
        );
        fireEvent.click(screen.getByTestId('trigger'));
        expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    it('renders defaultOpen state immediately', () => {
        render(
            <Dialog defaultOpen>
                <DialogContent testID="dialog">
                    <DialogTitle>Hi</DialogTitle>
                </DialogContent>
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
                        <DialogContent testID="dialog">
                            <DialogTitle>Hi</DialogTitle>
                        </DialogContent>
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
                <DialogContent testID="dialog">
                    <DialogTitle>Hi</DialogTitle>
                </DialogContent>
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
                <DialogContent>
                    <DialogTitle>Hi</DialogTitle>
                    <DialogClose asChild={false} testID="close">
                        Done
                    </DialogClose>
                </DialogContent>
            </Dialog>
        );
        fireEvent.click(screen.getByTestId('close'));
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('locks body scroll while open and restores on close', () => {
        const { rerender } = render(
            <Dialog open>
                <DialogContent testID="dialog">
                    <DialogTitle>Hi</DialogTitle>
                </DialogContent>
            </Dialog>
        );
        expect(document.body.style.overflow).toBe('hidden');
        rerender(
            <Dialog open={false}>
                <DialogContent testID="dialog">
                    <DialogTitle>Hi</DialogTitle>
                </DialogContent>
            </Dialog>
        );
        expect(document.body.style.overflow).toBe('');
    });

    it('wires aria-labelledby and aria-describedby to title and description', () => {
        render(
            <Dialog defaultOpen>
                <DialogContent testID="dialog">
                    <DialogTitle>The title</DialogTitle>
                    <DialogDescription>Some context</DialogDescription>
                </DialogContent>
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

    it('throws when DialogContent is rendered outside Dialog', () => {
        const original = console.error;
        console.error = () => {};
        try {
            expect(() =>
                render(
                    <DialogContent>
                        <DialogTitle>x</DialogTitle>
                    </DialogContent>
                )
            ).toThrow(/Dialog/);
        } finally {
            console.error = original;
        }
    });
});
