import { fireEvent, render, screen } from '@testing-library/react';
import { DropdownMenu } from '../DropdownMenu';

// jsdom returns zero rects by default. Stub so Popover can position content.
beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
        configurable: true,
        value() {
            return {
                top: 100,
                left: 200,
                width: 80,
                height: 32,
                right: 280,
                bottom: 132,
                x: 200,
                y: 100,
                toJSON: () => ({}),
            };
        },
    });
});

function BasicMenu({ onSelect }: { onSelect?: () => void }) {
    return (
        <DropdownMenu>
            <DropdownMenu.Trigger>
                <button type="button">Open Menu</button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content testID="menu-content">
                <DropdownMenu.Item onSelect={onSelect} testID="item-edit">
                    Edit
                </DropdownMenu.Item>
                <DropdownMenu.Item disabled testID="item-disabled">
                    Disabled
                </DropdownMenu.Item>
                <DropdownMenu.Separator testID="separator" />
                <DropdownMenu.Label>Actions</DropdownMenu.Label>
                <DropdownMenu.Item destructive onSelect={onSelect} testID="item-delete">
                    Delete
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu>
    );
}

describe('<DropdownMenu>', () => {
    it('starts closed — content not in DOM', () => {
        render(<BasicMenu />);
        expect(screen.queryByRole('menu')).toBeNull();
    });

    it('click on trigger opens the menu and shows content', () => {
        render(<BasicMenu />);
        fireEvent.click(screen.getByRole('button', { name: 'Open Menu' }));
        expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('trigger has aria-haspopup="menu"', () => {
        render(<BasicMenu />);
        const trigger = screen.getByRole('button', { name: 'Open Menu' });
        expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    });

    it('trigger aria-expanded reflects open state', () => {
        render(<BasicMenu />);
        const trigger = screen.getByRole('button', { name: 'Open Menu' });
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        fireEvent.click(trigger);
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('item onSelect fires and menu closes', () => {
        const onSelect = jest.fn();
        render(<BasicMenu onSelect={onSelect} />);
        fireEvent.click(screen.getByRole('button', { name: 'Open Menu' }));
        fireEvent.click(screen.getByTestId('item-edit'));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('menu')).toBeNull();
    });

    it('disabled item does not fire onSelect', () => {
        const onSelect = jest.fn();
        render(<BasicMenu onSelect={onSelect} />);
        fireEvent.click(screen.getByRole('button', { name: 'Open Menu' }));
        fireEvent.click(screen.getByTestId('item-disabled'));
        expect(onSelect).not.toHaveBeenCalled();
        // Menu stays open
        expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('Escape closes the menu', () => {
        render(<BasicMenu />);
        fireEvent.click(screen.getByRole('button', { name: 'Open Menu' }));
        expect(screen.getByRole('menu')).toBeInTheDocument();
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(screen.queryByRole('menu')).toBeNull();
    });

    it('separator has role="separator"', () => {
        render(<BasicMenu />);
        fireEvent.click(screen.getByRole('button', { name: 'Open Menu' }));
        expect(screen.getByRole('separator')).toBeInTheDocument();
    });
});
