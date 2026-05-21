import { fireEvent, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { NoriProvider } from '../../../../provider';
import { ContextMenu } from '../../ContextMenu';

const wrap = (ui: ReactNode) => <NoriProvider locale="en-US">{ui}</NoriProvider>;

// The Popover content on native is rendered inside a Modal whose transparent
// backdrop has aria-hidden=true. RNTL propagates accessibilityElementsHidden
// from the backdrop to all descendants, so default queries cannot see the menu
// items. Using `includeHiddenElements: true` opts out of this filtering.
const H = { includeHiddenElements: true } as const;

describe('<ContextMenu> native', () => {
    it('long press on trigger opens the menu', () => {
        const { getByTestId, getByText } = render(
            wrap(
                <ContextMenu>
                    <ContextMenu.Trigger>
                        <View testID="trigger-area">
                            <Text>Long press me</Text>
                        </View>
                    </ContextMenu.Trigger>
                    <ContextMenu.Content>
                        <ContextMenu.Item testID="item-copy" onSelect={jest.fn()}>
                            Copy
                        </ContextMenu.Item>
                    </ContextMenu.Content>
                </ContextMenu>
            )
        );

        // Menu closed initially
        expect(() => getByText('Copy', H)).toThrow();

        fireEvent(getByTestId('trigger-area'), 'longPress');

        // Menu now visible
        expect(getByText('Copy', H)).toBeTruthy();
    });

    it('pressing an item fires onSelect and closes the menu', () => {
        const onSelect = jest.fn();
        const { getByTestId, queryByText } = render(
            wrap(
                <ContextMenu>
                    <ContextMenu.Trigger>
                        <View testID="trigger-area">
                            <Text>Long press me</Text>
                        </View>
                    </ContextMenu.Trigger>
                    <ContextMenu.Content>
                        <ContextMenu.Item testID="item-copy" onSelect={onSelect}>
                            Copy
                        </ContextMenu.Item>
                    </ContextMenu.Content>
                </ContextMenu>
            )
        );

        fireEvent(getByTestId('trigger-area'), 'longPress');
        fireEvent.press(getByTestId('item-copy', H));

        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(queryByText('Copy', H)).toBeNull();
    });
});
