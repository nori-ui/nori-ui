import { fireEvent, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Pressable, Text } from 'react-native';
import { NoriProvider } from '../../../../provider';
import { Sheet } from '../../Sheet';

const wrap = (ui: ReactNode) => <NoriProvider locale="en-US">{ui}</NoriProvider>;

// The Sheet panel on native is rendered inside a Modal whose transparent
// backdrop has aria-hidden=true. RNTL propagates accessibilityElementsHidden
// from the backdrop to all descendants, so default queries cannot see the panel.
// Using `includeHiddenElements: true` opts out of this filtering.
const H = { includeHiddenElements: true } as const;

describe('<Sheet> native', () => {
    it('pressing the trigger opens the sheet', () => {
        const { getByTestId, getByText } = render(
            wrap(
                <Sheet>
                    <Sheet.Trigger>
                        <Pressable testID="trigger">
                            <Text>Open</Text>
                        </Pressable>
                    </Sheet.Trigger>
                    <Sheet.Panel>
                        <Sheet.Header>
                            <Sheet.Title>Settings</Sheet.Title>
                        </Sheet.Header>
                    </Sheet.Panel>
                </Sheet>
            )
        );

        // Sheet is closed initially
        expect(() => getByText('Settings', H)).toThrow();

        fireEvent.press(getByTestId('trigger'));

        // Sheet is now open
        expect(getByText('Settings', H)).toBeTruthy();
    });

    it('title renders inside open sheet', () => {
        const { getByText } = render(
            wrap(
                <Sheet defaultOpen>
                    <Sheet.Panel testID="panel">
                        <Sheet.Header>
                            <Sheet.Title>My Sheet</Sheet.Title>
                            <Sheet.Description>Description text</Sheet.Description>
                        </Sheet.Header>
                    </Sheet.Panel>
                </Sheet>
            )
        );
        expect(getByText('My Sheet', H)).toBeTruthy();
        expect(getByText('Description text', H)).toBeTruthy();
    });

    it('side prop is passed to the panel via testID', () => {
        const { getByTestId } = render(
            wrap(
                <Sheet defaultOpen side="right">
                    <Sheet.Panel testID="panel">
                        <Sheet.Header>
                            <Sheet.Title>Side panel</Sheet.Title>
                        </Sheet.Header>
                    </Sheet.Panel>
                </Sheet>
            )
        );
        // On native, data-side is not an accessibility prop so we just
        // confirm the panel renders correctly with the given side.
        expect(getByTestId('panel', H)).toBeTruthy();
    });

    it('Sheet.Close closes the sheet on press', () => {
        const { getByTestId, queryByText } = render(
            wrap(
                <Sheet defaultOpen>
                    <Sheet.Panel testID="panel">
                        <Sheet.Header>
                            <Sheet.Title>Title</Sheet.Title>
                        </Sheet.Header>
                        <Sheet.Footer>
                            <Sheet.Close asChild={false} testID="close">
                                Close
                            </Sheet.Close>
                        </Sheet.Footer>
                    </Sheet.Panel>
                </Sheet>
            )
        );
        expect(() => getByTestId('close', H)).not.toThrow();
        fireEvent.press(getByTestId('close', H));
        expect(queryByText('Title', H)).toBeNull();
    });

    it('controlled mode: open prop drives visibility', () => {
        const onOpenChange = jest.fn();
        const { rerender, queryByText } = render(
            wrap(
                <Sheet open={true} onOpenChange={onOpenChange}>
                    <Sheet.Panel>
                        <Sheet.Header>
                            <Sheet.Title>Controlled</Sheet.Title>
                        </Sheet.Header>
                    </Sheet.Panel>
                </Sheet>
            )
        );
        expect(queryByText('Controlled', H)).toBeTruthy();

        rerender(
            wrap(
                <Sheet open={false} onOpenChange={onOpenChange}>
                    <Sheet.Panel>
                        <Sheet.Header>
                            <Sheet.Title>Controlled</Sheet.Title>
                        </Sheet.Header>
                    </Sheet.Panel>
                </Sheet>
            )
        );
        expect(queryByText('Controlled', H)).toBeNull();
    });
});
