import { fireEvent, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Pressable, Text } from 'react-native';
import { NoriProvider } from '../../../../provider';
import { DropdownMenu } from '../../DropdownMenu';

const wrap = (ui: ReactNode) => <NoriProvider locale="en-US">{ui}</NoriProvider>;

// The Popover content on native is rendered inside a Modal whose transparent
// backdrop has aria-hidden=true. RNTL propagates accessibilityElementsHidden
// from the backdrop to all descendants, so default queries cannot see the menu
// items. Using `includeHiddenElements: true` opts out of this filtering.
const H = { includeHiddenElements: true } as const;

describe('<DropdownMenu> native', () => {
    it('pressing the trigger opens the menu', () => {
        const { getByTestId, getByText } = render(
            wrap(
                <DropdownMenu>
                    <DropdownMenu.Trigger>
                        <Pressable testID="trigger">
                            <Text>Open</Text>
                        </Pressable>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content>
                        <DropdownMenu.Item testID="item-one" onSelect={jest.fn()}>
                            Item One
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu>
            )
        );

        // Menu is closed initially
        expect(() => getByText('Item One', H)).toThrow();

        fireEvent.press(getByTestId('trigger'));

        // Menu is now visible (query with includeHiddenElements to reach Modal content)
        expect(getByText('Item One', H)).toBeTruthy();
    });

    it('pressing an item fires onSelect and closes the menu', () => {
        const onSelect = jest.fn();
        const { getByTestId, queryByText } = render(
            wrap(
                <DropdownMenu>
                    <DropdownMenu.Trigger>
                        <Pressable testID="trigger">
                            <Text>Open</Text>
                        </Pressable>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content>
                        <DropdownMenu.Item testID="item-one" onSelect={onSelect}>
                            Item One
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu>
            )
        );

        fireEvent.press(getByTestId('trigger'));
        fireEvent.press(getByTestId('item-one', H));

        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(queryByText('Item One', H)).toBeNull();
    });
});
