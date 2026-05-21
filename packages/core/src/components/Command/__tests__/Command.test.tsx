import { fireEvent, render, screen } from '@testing-library/react';
import { Command } from '../Command';

describe('<Command> web', () => {
    it('starts closed when defaultOpen is omitted', () => {
        render(
            <Command>
                <Command.Trigger>
                    <button type="button" data-testid="trigger">
                        Search
                    </button>
                </Command.Trigger>
                <Command.Dialog>
                    <Command.Group heading="Suggestions">
                        <Command.Item onSelect={() => {}}>Calendar</Command.Item>
                    </Command.Group>
                </Command.Dialog>
            </Command>
        );
        expect(screen.queryByText('Calendar')).toBeNull();
    });

    it('clicking Trigger opens the palette', () => {
        render(
            <Command>
                <Command.Trigger>
                    <button type="button" data-testid="trigger">
                        Search
                    </button>
                </Command.Trigger>
                <Command.Dialog>
                    <Command.Group heading="Suggestions">
                        <Command.Item onSelect={() => {}}>Calendar</Command.Item>
                    </Command.Group>
                </Command.Dialog>
            </Command>
        );
        fireEvent.click(screen.getByTestId('trigger'));
        // query by text — items render inside the modal DOM
        expect(screen.getByText('Calendar')).toBeInTheDocument();
    });

    it('typing a query filters items', () => {
        render(
            <Command defaultOpen>
                <Command.Dialog placeholder="Search…">
                    <Command.Empty>No results found.</Command.Empty>
                    <Command.Group heading="Suggestions">
                        <Command.Item onSelect={() => {}}>Calendar</Command.Item>
                        <Command.Item onSelect={() => {}}>Search Emoji</Command.Item>
                        <Command.Item onSelect={() => {}}>Calculator</Command.Item>
                    </Command.Group>
                </Command.Dialog>
            </Command>
        );

        // The search input doesn't have an accessible role in jsdom because it's
        // inside a Modal. Query by placeholder text instead.
        const input = screen.getByPlaceholderText('Search…');
        fireEvent.change(input, { target: { value: 'calc' } });

        expect(screen.getByText('Calculator')).toBeInTheDocument();
        expect(screen.queryByText('Calendar')).toBeNull();
        expect(screen.queryByText('Search Emoji')).toBeNull();
    });

    it('shows Empty state when query has no matches', () => {
        render(
            <Command defaultOpen>
                <Command.Dialog placeholder="Filter…">
                    <Command.Empty>No results found.</Command.Empty>
                    <Command.Group heading="Suggestions">
                        <Command.Item onSelect={() => {}}>Calendar</Command.Item>
                        <Command.Item onSelect={() => {}}>Calculator</Command.Item>
                    </Command.Group>
                </Command.Dialog>
            </Command>
        );

        const input = screen.getByPlaceholderText('Filter…');
        fireEvent.change(input, { target: { value: 'zzzznothing' } });

        expect(screen.getByText('No results found.')).toBeInTheDocument();
    });

    it('selecting an item fires onSelect and closes the palette', () => {
        const onSelect = jest.fn();
        render(
            <Command defaultOpen>
                <Command.Dialog>
                    <Command.Group heading="Actions">
                        <Command.Item onSelect={onSelect} testID="item">
                            Calendar
                        </Command.Item>
                    </Command.Group>
                </Command.Dialog>
            </Command>
        );

        fireEvent.click(screen.getByTestId('item'));
        expect(onSelect).toHaveBeenCalledTimes(1);
        // After selection dialog should close — item is no longer in document
        expect(screen.queryByText('Calendar')).toBeNull();
    });

    it('Escape closes the palette', () => {
        render(
            <Command defaultOpen>
                <Command.Dialog>
                    <Command.Group heading="Actions">
                        <Command.Item onSelect={() => {}}>Calendar</Command.Item>
                    </Command.Group>
                </Command.Dialog>
            </Command>
        );

        expect(screen.getByText('Calendar')).toBeInTheDocument();
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(screen.queryByText('Calendar')).toBeNull();
    });

    it('Shortcut renders inside Item', () => {
        render(
            <Command defaultOpen>
                <Command.Dialog>
                    <Command.Group heading="Settings">
                        <Command.Item onSelect={() => {}}>
                            Profile
                            <Command.Shortcut>⌘P</Command.Shortcut>
                        </Command.Item>
                    </Command.Group>
                </Command.Dialog>
            </Command>
        );

        expect(screen.getByText('⌘P')).toBeInTheDocument();
    });

    it('Group heading renders', () => {
        render(
            <Command defaultOpen>
                <Command.Dialog>
                    <Command.Group heading="Suggestions">
                        <Command.Item onSelect={() => {}}>Calendar</Command.Item>
                    </Command.Group>
                </Command.Dialog>
            </Command>
        );

        expect(screen.getByText('Suggestions')).toBeInTheDocument();
    });

    it('throws when Item rendered outside Command', () => {
        const original = console.error;
        console.error = () => {};
        try {
            expect(() => render(<Command.Item onSelect={() => {}}>Calendar</Command.Item>)).toThrow(/Command/);
        } finally {
            console.error = original;
        }
    });

    it('disabled Item does not fire onSelect', () => {
        const onSelect = jest.fn();
        render(
            <Command defaultOpen>
                <Command.Dialog>
                    <Command.Group heading="Actions">
                        <Command.Item disabled onSelect={onSelect} testID="disabled-item">
                            Disabled
                        </Command.Item>
                    </Command.Group>
                </Command.Dialog>
            </Command>
        );

        fireEvent.click(screen.getByTestId('disabled-item'));
        expect(onSelect).not.toHaveBeenCalled();
    });
});
