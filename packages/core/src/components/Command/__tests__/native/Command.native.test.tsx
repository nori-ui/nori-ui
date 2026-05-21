/**
 * Native tests for Command.
 *
 * RN's Modal wraps its children in a view with aria-hidden=true when
 * visible=false. RNTL propagates accessibilityElementsHidden to all
 * descendants, so default queries cannot see content inside a closed modal.
 * We use `includeHiddenElements: true` to opt out of this filtering — the
 * same pattern used by the Sheet native tests.
 */
import { fireEvent, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { NoriProvider } from '../../../../provider';
import { Command } from '../../Command';

const wrap = (ui: ReactNode) => <NoriProvider locale="en-US">{ui}</NoriProvider>;

// Option bag that bypasses hidden-element filtering for Modal content
const H = { includeHiddenElements: true } as const;

describe('<Command> native', () => {
    it('starts closed when defaultOpen is omitted', () => {
        const { queryByTestId } = render(
            wrap(
                <Command>
                    <Command.Trigger>
                        <View>
                            <Text>Open palette</Text>
                        </View>
                    </Command.Trigger>
                    <Command.Dialog>
                        <Command.Group heading="Suggestions">
                            <Command.Item onSelect={() => {}} testID="item-calendar">
                                Calendar
                            </Command.Item>
                        </Command.Group>
                    </Command.Dialog>
                </Command>
            )
        );
        // Item is in the tree (inside Modal) but modal is not visible yet.
        // When closed the item Pressable does not have the testID in the
        // visible tree — Dialog.Content only renders when open.
        expect(queryByTestId('item-calendar')).toBeNull();
    });

    it('opens via trigger press on native', () => {
        const { getByText, getByTestId } = render(
            wrap(
                <Command>
                    <Command.Trigger>
                        <View>
                            <Text>Open palette</Text>
                        </View>
                    </Command.Trigger>
                    <Command.Dialog>
                        <Command.Group heading="Suggestions">
                            <Command.Item onSelect={() => {}} testID="item-calendar">
                                Calendar
                            </Command.Item>
                        </Command.Group>
                    </Command.Dialog>
                </Command>
            )
        );
        fireEvent.press(getByText('Open palette'));
        // After opening, the item should be accessible (hidden=true needed for Modal)
        expect(getByTestId('item-calendar', H)).toBeTruthy();
    });

    it('filters items by query on native', () => {
        const { getByPlaceholderText, queryByTestId, getByTestId } = render(
            wrap(
                <Command defaultOpen>
                    <Command.Dialog placeholder="Search native">
                        <Command.Group heading="Suggestions">
                            <Command.Item onSelect={() => {}} testID="item-calendar">
                                Calendar
                            </Command.Item>
                            <Command.Item onSelect={() => {}} testID="item-calculator">
                                Calculator
                            </Command.Item>
                        </Command.Group>
                    </Command.Dialog>
                </Command>
            )
        );

        const input = getByPlaceholderText('Search native', H);
        fireEvent.changeText(input, 'Calcul');

        expect(getByTestId('item-calculator', H)).toBeTruthy();
        expect(queryByTestId('item-calendar')).toBeNull();
    });
});
