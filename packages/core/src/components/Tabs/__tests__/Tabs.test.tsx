import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../Tabs';

describe('<Tabs>', () => {
    it('renders tablist with the matching panel for the default value', () => {
        render(
            <Tabs defaultValue="b">
                <TabsList>
                    <TabsTrigger value="a">A</TabsTrigger>
                    <TabsTrigger value="b">B</TabsTrigger>
                </TabsList>
                <TabsContent value="a">A content</TabsContent>
                <TabsContent value="b">B content</TabsContent>
            </Tabs>
        );
        expect(screen.queryByText('A content')).toBeNull();
        expect(screen.getByText('B content')).toBeInTheDocument();
    });

    it('clicking a trigger switches the active panel (uncontrolled)', () => {
        render(
            <Tabs defaultValue="a">
                <TabsList>
                    <TabsTrigger value="a">A</TabsTrigger>
                    <TabsTrigger value="b" testID="tab-b">
                        B
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="a">A content</TabsContent>
                <TabsContent value="b">B content</TabsContent>
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
                        <TabsList>
                            <TabsTrigger value="a">A</TabsTrigger>
                            <TabsTrigger value="b" testID="tab-b">
                                B
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="a">A content</TabsContent>
                        <TabsContent value="b">B content</TabsContent>
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
                <TabsList>
                    <TabsTrigger value="a" testID="tab-a">
                        A
                    </TabsTrigger>
                    <TabsTrigger value="b" testID="tab-b">
                        B
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="a">A</TabsContent>
                <TabsContent value="b">B</TabsContent>
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
                <TabsList>
                    <TabsTrigger value="a" testID="tab-a">
                        A
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="a" testID="panel-a">
                    A content
                </TabsContent>
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
                <TabsList>
                    <TabsTrigger value="a" testID="tab-a">
                        A
                    </TabsTrigger>
                    <TabsTrigger value="b" testID="tab-b">
                        B
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="a">A content</TabsContent>
                <TabsContent value="b">B content</TabsContent>
            </Tabs>
        );
        fireEvent.keyDown(screen.getByTestId('tab-a'), { key: 'ArrowRight' });
        expect(screen.getByTestId('tab-b').getAttribute('aria-selected')).toBe('true');
        expect(screen.getByText('B content')).toBeInTheDocument();
    });

    it('manual activation: arrow keys move focus only; Enter activates', () => {
        render(
            <Tabs defaultValue="a" activation="manual">
                <TabsList>
                    <TabsTrigger value="a" testID="tab-a">
                        A
                    </TabsTrigger>
                    <TabsTrigger value="b" testID="tab-b">
                        B
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="a">A content</TabsContent>
                <TabsContent value="b">B content</TabsContent>
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
                <TabsList>
                    <TabsTrigger value="a">A</TabsTrigger>
                    <TabsTrigger value="b" disabled testID="tab-b">
                        B
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="a">A content</TabsContent>
                <TabsContent value="b">B content</TabsContent>
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
            expect(() => render(<TabsTrigger value="x">x</TabsTrigger>)).toThrow(/TabsTrigger/);
        } finally {
            console.error = original;
        }
    });
});
