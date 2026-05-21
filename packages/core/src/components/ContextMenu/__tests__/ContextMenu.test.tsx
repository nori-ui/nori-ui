import { fireEvent, render, screen } from '@testing-library/react';
import { ContextMenu } from '../ContextMenu';

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

function BasicContextMenu({ onSelect }: { onSelect?: () => void }) {
    return (
        <ContextMenu>
            <ContextMenu.Trigger>
                <div data-testid="trigger-area">Right-click me</div>
            </ContextMenu.Trigger>
            <ContextMenu.Content>
                <ContextMenu.Item onSelect={onSelect} testID="item-copy">
                    Copy
                </ContextMenu.Item>
                <ContextMenu.Item onSelect={onSelect} testID="item-paste">
                    Paste
                </ContextMenu.Item>
            </ContextMenu.Content>
        </ContextMenu>
    );
}

describe('<ContextMenu>', () => {
    it('starts closed', () => {
        render(<BasicContextMenu />);
        expect(screen.queryByRole('menu')).toBeNull();
    });

    it('right-click on trigger opens the menu', () => {
        render(<BasicContextMenu />);
        fireEvent.contextMenu(screen.getByTestId('trigger-area'));
        expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('item onSelect fires and menu closes', () => {
        const onSelect = jest.fn();
        render(<BasicContextMenu onSelect={onSelect} />);
        fireEvent.contextMenu(screen.getByTestId('trigger-area'));
        fireEvent.click(screen.getByTestId('item-copy'));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('menu')).toBeNull();
    });

    it('Escape closes the menu', () => {
        render(<BasicContextMenu />);
        fireEvent.contextMenu(screen.getByTestId('trigger-area'));
        expect(screen.getByRole('menu')).toBeInTheDocument();
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(screen.queryByRole('menu')).toBeNull();
    });
});
