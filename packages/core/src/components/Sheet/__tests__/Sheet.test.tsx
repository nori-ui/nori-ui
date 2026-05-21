import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Button } from '../../Button';
import { Sheet } from '../Sheet';

describe('<Sheet>', () => {
    it('starts closed when defaultOpen is omitted', () => {
        render(
            <Sheet>
                <Sheet.Trigger asChild={false}>Open</Sheet.Trigger>
                <Sheet.Panel testID="sheet">
                    <Sheet.Title>Title</Sheet.Title>
                </Sheet.Panel>
            </Sheet>
        );
        expect(screen.queryByTestId('sheet')).toBeNull();
    });

    it('opens when the trigger is clicked', () => {
        render(
            <Sheet>
                <Sheet.Trigger asChild={false} testID="trigger">
                    Open
                </Sheet.Trigger>
                <Sheet.Panel testID="sheet">
                    <Sheet.Title>Title</Sheet.Title>
                </Sheet.Panel>
            </Sheet>
        );
        fireEvent.click(screen.getByTestId('trigger'));
        expect(screen.getByTestId('sheet')).toBeInTheDocument();
    });

    it('asChild trigger forwards both onClick and onPress so a wrapped Button opens the sheet', () => {
        render(
            <Sheet>
                <Sheet.Trigger>
                    <Button testID="trigger">Open</Button>
                </Sheet.Trigger>
                <Sheet.Panel testID="sheet">
                    <Sheet.Title>Title</Sheet.Title>
                </Sheet.Panel>
            </Sheet>
        );
        fireEvent.click(screen.getByTestId('trigger'));
        expect(screen.getByTestId('sheet')).toBeInTheDocument();
    });

    it('renders Title and Description inside the panel', () => {
        render(
            <Sheet defaultOpen>
                <Sheet.Panel testID="sheet">
                    <Sheet.Header>
                        <Sheet.Title>My Title</Sheet.Title>
                        <Sheet.Description>My description</Sheet.Description>
                    </Sheet.Header>
                    <Sheet.Body>body content</Sheet.Body>
                </Sheet.Panel>
            </Sheet>
        );
        expect(screen.getByText('My Title')).toBeInTheDocument();
        expect(screen.getByText('My description')).toBeInTheDocument();
    });

    it('Escape closes the sheet', () => {
        render(
            <Sheet defaultOpen>
                <Sheet.Panel testID="sheet">
                    <Sheet.Title>Title</Sheet.Title>
                </Sheet.Panel>
            </Sheet>
        );
        expect(screen.getByTestId('sheet')).toBeInTheDocument();
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(screen.queryByTestId('sheet')).toBeNull();
    });

    it('clicking backdrop closes when dismissible (default)', () => {
        render(
            <Sheet defaultOpen dismissible>
                <Sheet.Panel testID="sheet">
                    <Sheet.Title>Title</Sheet.Title>
                </Sheet.Panel>
            </Sheet>
        );
        expect(screen.getByTestId('sheet')).toBeInTheDocument();
        // The backdrop is the Modal's outermost Pressable (aria-hidden)
        const backdrop = document.querySelector('[aria-hidden="true"]');
        expect(backdrop).not.toBeNull();
        fireEvent.click(backdrop as Element);
        expect(screen.queryByTestId('sheet')).toBeNull();
    });

    it('clicking backdrop does NOT close when dismissible=false', () => {
        render(
            <Sheet defaultOpen dismissible={false}>
                <Sheet.Panel testID="sheet">
                    <Sheet.Title>Title</Sheet.Title>
                </Sheet.Panel>
            </Sheet>
        );
        const backdrop = document.querySelector('[aria-hidden="true"]');
        expect(backdrop).not.toBeNull();
        fireEvent.click(backdrop as Element);
        expect(screen.getByTestId('sheet')).toBeInTheDocument();
    });

    it('controlled: parent open prop drives state', () => {
        const Wrapper = () => {
            const [open, setOpen] = useState(true);
            return (
                <>
                    <button type="button" data-testid="external" onClick={() => setOpen(false)}>
                        close-from-outside
                    </button>
                    <Sheet open={open} onOpenChange={setOpen}>
                        <Sheet.Panel testID="sheet">
                            <Sheet.Title>Title</Sheet.Title>
                        </Sheet.Panel>
                    </Sheet>
                </>
            );
        };
        render(<Wrapper />);
        expect(screen.getByTestId('sheet')).toBeInTheDocument();
        fireEvent.click(screen.getByTestId('external'));
        expect(screen.queryByTestId('sheet')).toBeNull();
    });

    it('side="right" sets data-side attribute on panel', () => {
        render(
            <Sheet defaultOpen side="right">
                <Sheet.Panel testID="sheet">
                    <Sheet.Title>Title</Sheet.Title>
                </Sheet.Panel>
            </Sheet>
        );
        expect(screen.getByTestId('sheet').getAttribute('data-side')).toBe('right');
    });

    it('side="bottom" (default) sets data-side attribute on panel', () => {
        render(
            <Sheet defaultOpen>
                <Sheet.Panel testID="sheet">
                    <Sheet.Title>Title</Sheet.Title>
                </Sheet.Panel>
            </Sheet>
        );
        expect(screen.getByTestId('sheet').getAttribute('data-side')).toBe('bottom');
    });

    it('panel has role="dialog" and aria-modal="true"', () => {
        render(
            <Sheet defaultOpen>
                <Sheet.Panel testID="sheet">
                    <Sheet.Title>Title</Sheet.Title>
                </Sheet.Panel>
            </Sheet>
        );
        const panel = screen.getByTestId('sheet');
        expect(panel.getAttribute('role')).toBe('dialog');
        expect(panel.getAttribute('aria-modal')).toBe('true');
    });

    it('wires aria-labelledby and aria-describedby to title and description', () => {
        render(
            <Sheet defaultOpen>
                <Sheet.Panel testID="sheet">
                    <Sheet.Header>
                        <Sheet.Title>The title</Sheet.Title>
                        <Sheet.Description>The description</Sheet.Description>
                    </Sheet.Header>
                </Sheet.Panel>
            </Sheet>
        );
        const panel = screen.getByTestId('sheet');
        const labelledBy = panel.getAttribute('aria-labelledby');
        const describedBy = panel.getAttribute('aria-describedby');
        expect(labelledBy).not.toBeNull();
        expect(describedBy).not.toBeNull();
        expect(document.getElementById(labelledBy as string)?.textContent).toBe('The title');
        expect(document.getElementById(describedBy as string)?.textContent).toBe('The description');
    });

    it('SheetClose asChild forwards both onClick and onPress to dismiss', () => {
        render(
            <Sheet defaultOpen>
                <Sheet.Panel testID="sheet">
                    <Sheet.Title>Title</Sheet.Title>
                    <Sheet.Close>
                        <Button testID="close">Close</Button>
                    </Sheet.Close>
                </Sheet.Panel>
            </Sheet>
        );
        fireEvent.click(screen.getByTestId('close'));
        expect(screen.queryByTestId('sheet')).toBeNull();
    });

    it('throws when SheetPanel is rendered outside Sheet', () => {
        const original = console.error;
        console.error = () => {};
        try {
            expect(() =>
                render(
                    <Sheet.Panel>
                        <Sheet.Title>x</Sheet.Title>
                    </Sheet.Panel>
                )
            ).toThrow(/Sheet/);
        } finally {
            console.error = original;
        }
    });
});
