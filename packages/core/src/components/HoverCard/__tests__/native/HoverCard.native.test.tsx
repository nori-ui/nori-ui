import { render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { NoriProvider } from '../../../../provider';
import { HoverCard } from '../../HoverCard.native';

const wrap = (ui: ReactNode) => <NoriProvider locale="en-US">{ui}</NoriProvider>;

describe('<HoverCard> native', () => {
    it('renders the trigger child', () => {
        const { getByText } = render(
            wrap(
                <HoverCard>
                    <HoverCard.Trigger>
                        <View>
                            <Text>Hover trigger</Text>
                        </View>
                    </HoverCard.Trigger>
                    <HoverCard.Content>
                        <Text>Card content</Text>
                    </HoverCard.Content>
                </HoverCard>
            )
        );
        expect(getByText('Hover trigger')).toBeTruthy();
    });

    it('does NOT render card content on native', () => {
        const { queryByText } = render(
            wrap(
                <HoverCard>
                    <HoverCard.Trigger>
                        <View>
                            <Text>Trigger</Text>
                        </View>
                    </HoverCard.Trigger>
                    <HoverCard.Content>
                        <Text>This should not appear on native</Text>
                    </HoverCard.Content>
                </HoverCard>
            )
        );
        expect(queryByText('This should not appear on native')).toBeNull();
    });

    it('HoverCard.Content renders null on native', () => {
        const result = render(
            wrap(
                <HoverCard.Content>
                    <Text>Hidden</Text>
                </HoverCard.Content>
            )
        );
        expect(result.toJSON()).toBeNull();
    });
});
