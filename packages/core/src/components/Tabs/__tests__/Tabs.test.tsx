import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Tabs } from '../Tabs';

describe('<Tabs>', () => {
    it('renders tablist with the matching panel for the default value', () => {
        render(
            <Tabs defaultValue="b">
                <Tabs.List>
                    <Tabs.Trigger value="a">A</Tabs.Trigger>
                    <Tabs.Trigger value="b">B</Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="a">A content</Tabs.Content>
                <Tabs.Content value="b">B content</Tabs.Content>
            </Tabs>
        );
        expect(screen.queryByText('A content')).toBeNull();
        expect(screen.getByText('B content')).toBeInTheDocument();
    });

    it('clicking a trigger switches the active panel (uncontrolled)', () => {
        render(
            <Tabs defaultValue="a">
                <Tabs.List>
                    <Tabs.Trigger value="a">A</Tabs.Trigger>
                    <Tabs.Trigger value="b" testID="tab-b">
                        B
                    </Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="a">A content</Tabs.Content>
                <Tabs.Content value="b">B content</Tabs.Content>
            </Tabs>
        );
        fireEvent.click(screen.getByTestId('tab-b'));
        expect(screen.queryByText('A content')).toBeNull();
        expect(screen.getByText('B content')).toBeInTheDocument();
    });

    it('controlled: parent state drives the active tab', () => {
        const Wrapper = () => {
            const [v, setV] = useState('a');
            return (
                <>
                    <span data-testid="cur">{v}</span>
                    <Tabs value={v} onChange={setV}>
                        <Tabs.List>
                            <Tabs.Trigger value="a">A</Tabs.Trigger>
                            <Tabs.Trigger value="b" testID="tab-b">
                                B
                            </Tabs.Trigger>
                        </Tabs.List>
                        <Tabs.Content value="a">A content</Tabs.Content>
                        <Tabs.Content value="b">B content</Tabs.Content>
                    </Tabs>
                </>
            );
        };
        render(<Wrapper />);
        fireEvent.click(screen.getByTestId('tab-b'));
        expect(screen.getByTestId('cur').textContent).toBe('b');
    });

    it('exposes role="tab" with aria-selected; only the active tab has tabIndex 0', () => {
        render(
            <Tabs defaultValue="a">
                <Tabs.List>
                    <Tabs.Trigger value="a" testID="tab-a">
                        A
                    </Tabs.Trigger>
                    <Tabs.Trigger value="b" testID="tab-b">
                        B
                    </Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="a">A</Tabs.Content>
                <Tabs.Content value="b">B</Tabs.Content>
            </Tabs>
        );
        const tabA = screen.getByTestId('tab-a');
        const tabB = screen.getByTestId('tab-b');
        expect(tabA.getAttribute('role')).toBe('tab');
        expect(tabA.getAttribute('aria-selected')).toBe('true');
        expect(tabA.getAttribute('tabindex')).toBe('0');
        expect(tabB.getAttribute('aria-selected')).toBe('false');
        expect(tabB.getAttribute('tabindex')).toBe('-1');
    });

    it('aria-controls links the trigger to its panel via shared id', () => {
        render(
            <Tabs defaultValue="a">
                <Tabs.List>
                    <Tabs.Trigger value="a" testID="tab-a">
                        A
                    </Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="a" testID="panel-a">
                    A content
                </Tabs.Content>
            </Tabs>
        );
        const tab = screen.getByTestId('tab-a');
        const panel = screen.getByTestId('panel-a');
        expect(tab.getAttribute('aria-controls')).toBe(panel.getAttribute('id'));
        expect(panel.getAttribute('aria-labelledby')).toBe(tab.getAttribute('id'));
    });

    it('ArrowRight on the active trigger activates the next tab (automatic activation)', () => {
        render(
            <Tabs defaultValue="a">
                <Tabs.List>
                    <Tabs.Trigger value="a" testID="tab-a">
                        A
                    </Tabs.Trigger>
                    <Tabs.Trigger value="b" testID="tab-b">
                        B
                    </Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="a">A content</Tabs.Content>
                <Tabs.Content value="b">B content</Tabs.Content>
            </Tabs>
        );
        fireEvent.keyDown(screen.getByTestId('tab-a'), { key: 'ArrowRight' });
        expect(screen.getByTestId('tab-b').getAttribute('aria-selected')).toBe('true');
        expect(screen.getByText('B content')).toBeInTheDocument();
    });

    it('manual activation: arrow keys move focus only; Enter activates', () => {
        render(
            <Tabs defaultValue="a" activation="manual">
                <Tabs.List>
                    <Tabs.Trigger value="a" testID="tab-a">
                        A
                    </Tabs.Trigger>
                    <Tabs.Trigger value="b" testID="tab-b">
                        B
                    </Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="a">A content</Tabs.Content>
                <Tabs.Content value="b">B content</Tabs.Content>
            </Tabs>
        );
        fireEvent.keyDown(screen.getByTestId('tab-a'), { key: 'ArrowRight' });
        // Focus moved but selection didn't.
        expect(screen.getByTestId('tab-a').getAttribute('aria-selected')).toBe('true');
        expect(screen.getByText('A content')).toBeInTheDocument();
        // Press Enter on the focused (now b) trigger to activate.
        fireEvent.keyDown(screen.getByTestId('tab-b'), { key: 'Enter' });
        expect(screen.getByTestId('tab-b').getAttribute('aria-selected')).toBe('true');
        expect(screen.getByText('B content')).toBeInTheDocument();
    });

    it('disabled trigger ignores clicks', () => {
        render(
            <Tabs defaultValue="a">
                <Tabs.List>
                    <Tabs.Trigger value="a">A</Tabs.Trigger>
                    <Tabs.Trigger value="b" disabled testID="tab-b">
                        B
                    </Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="a">A content</Tabs.Content>
                <Tabs.Content value="b">B content</Tabs.Content>
            </Tabs>
        );
        fireEvent.click(screen.getByTestId('tab-b'));
        expect(screen.getByText('A content')).toBeInTheDocument();
        expect(screen.queryByText('B content')).toBeNull();
    });

    it('throws a clear error when TabsTrigger is rendered outside Tabs', () => {
        const original = console.error;
        console.error = () => {};
        try {
            expect(() => render(<Tabs.Trigger value="x">x</Tabs.Trigger>)).toThrow(/TabsTrigger/);
        } finally {
            console.error = original;
        }
    });
});
