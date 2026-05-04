import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { FloatButton } from '../FloatButton';

describe('<FloatButton>', () => {
    it('renders an accessible button with the given label', () => {
        render(<FloatButton accessibilityLabel="New item" testID="fab" />);
        const fab = screen.getByTestId('fab');
        expect(fab.getAttribute('aria-label')).toBe('New item');
    });

    it('calls onPress when clicked', () => {
        const onPress = jest.fn();
        render(<FloatButton accessibilityLabel="New" testID="fab" onPress={onPress} />);
        fireEvent.click(screen.getByTestId('fab'));
        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('falls back to onClick when onPress is not provided', () => {
        const onClick = jest.fn();
        render(<FloatButton accessibilityLabel="New" testID="fab" onClick={onClick} />);
        fireEvent.click(screen.getByTestId('fab'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('prefers onPress over onClick when both are defined and warns in dev', () => {
        const onPress = jest.fn();
        const onClick = jest.fn();
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        render(<FloatButton accessibilityLabel="N" testID="fab" onPress={onPress} onClick={onClick} />);
        fireEvent.click(screen.getByTestId('fab'));
        expect(onPress).toHaveBeenCalledTimes(1);
        expect(onClick).not.toHaveBeenCalled();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('both `onPress` and `onClick`'));
        warn.mockRestore();
    });

    it('does not fire onPress when disabled', () => {
        const onPress = jest.fn();
        render(<FloatButton accessibilityLabel="N" testID="fab" disabled onPress={onPress} />);
        fireEvent.click(screen.getByTestId('fab'));
        expect(onPress).not.toHaveBeenCalled();
    });

    it('does not fire onPress when loading and exposes aria-busy', () => {
        const onPress = jest.fn();
        render(<FloatButton accessibilityLabel="N" testID="fab" loading onPress={onPress} />);
        const fab = screen.getByTestId('fab');
        fireEvent.click(fab);
        expect(onPress).not.toHaveBeenCalled();
        expect(fab.getAttribute('aria-busy')).toBe('true');
    });

    it('renders a badge overlay when badge prop is set', () => {
        render(<FloatButton accessibilityLabel="N" testID="fab" badge={{ count: 7 }} />);
        expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('renders the label inline when shape is extended', () => {
        render(<FloatButton label="New item" accessibilityLabel="New item" shape="extended" testID="fab" />);
        expect(screen.getByText('New item')).toBeInTheDocument();
    });
});

describe('<FloatButton.Group>', () => {
    it('starts collapsed and opens on trigger press', () => {
        function Demo() {
            return (
                <FloatButton.Group accessibilityLabel="Actions" testID="trigger">
                    <FloatButton accessibilityLabel="Action 1" testID="action-1" />
                    <FloatButton accessibilityLabel="Action 2" testID="action-2" />
                </FloatButton.Group>
            );
        }
        render(<Demo />);
        // Collapsed — actions not in DOM
        expect(screen.queryByTestId('action-1')).toBeNull();
        // Open
        fireEvent.click(screen.getByTestId('trigger'));
        expect(screen.getByTestId('action-1')).toBeInTheDocument();
        expect(screen.getByTestId('action-2')).toBeInTheDocument();
    });

    it('respects controlled `open` prop and fires onOpenChange', () => {
        const onOpenChange = jest.fn();
        function Demo() {
            const [open, setOpen] = useState(false);
            return (
                <FloatButton.Group
                    accessibilityLabel="Actions"
                    testID="trigger"
                    open={open}
                    onOpenChange={(next) => {
                        setOpen(next);
                        onOpenChange(next);
                    }}
                >
                    <FloatButton accessibilityLabel="Action 1" testID="action-1" />
                </FloatButton.Group>
            );
        }
        render(<Demo />);
        fireEvent.click(screen.getByTestId('trigger'));
        expect(onOpenChange).toHaveBeenCalledWith(true);
        expect(screen.getByTestId('action-1')).toBeInTheDocument();
    });

    it('closes the group after an action is pressed', () => {
        const onPress = jest.fn();
        function Demo() {
            return (
                <FloatButton.Group accessibilityLabel="Actions" testID="trigger" defaultOpen>
                    <FloatButton accessibilityLabel="Action 1" testID="action-1" onPress={onPress} />
                </FloatButton.Group>
            );
        }
        render(<Demo />);
        fireEvent.click(screen.getByTestId('action-1'));
        expect(onPress).toHaveBeenCalledTimes(1);
        // Group closed → action no longer in DOM
        expect(screen.queryByTestId('action-1')).toBeNull();
    });

    it('renders actions from the `actions` array prop', () => {
        render(
            <FloatButton.Group
                accessibilityLabel="Actions"
                testID="trigger"
                defaultOpen
                actions={[
                    { accessibilityLabel: 'A', testID: 'fab-a' },
                    { accessibilityLabel: 'B', testID: 'fab-b' },
                ]}
            />
        );
        expect(screen.getByTestId('fab-a')).toBeInTheDocument();
        expect(screen.getByTestId('fab-b')).toBeInTheDocument();
    });

    it('exposes aria-haspopup="menu" + aria-expanded on the trigger', () => {
        render(
            <FloatButton.Group accessibilityLabel="Actions" testID="trigger" defaultOpen>
                <FloatButton accessibilityLabel="A" testID="a" />
            </FloatButton.Group>
        );
        const trigger = screen.getByTestId('trigger');
        expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('renders a backdrop when `backdrop` is true and the group is open', () => {
        render(
            <FloatButton.Group accessibilityLabel="Actions" testID="trigger" defaultOpen backdrop>
                <FloatButton accessibilityLabel="A" testID="a" />
            </FloatButton.Group>
        );
        // The backdrop is the only Pressable with the "Close" a11y label.
        expect(screen.getByLabelText('Close')).toBeInTheDocument();
    });
});

describe('<FloatButton.BackToTop>', () => {
    it('starts hidden and exposes a Back-to-top accessible label', () => {
        render(<FloatButton.BackToTop testID="bt" />);
        const bt = screen.getByTestId('bt');
        expect(bt.getAttribute('aria-label')).toBe('Back to top');
    });
});
