'use client';

import { Collapsible, Text } from '@nori-ui/core';
import { View } from 'react-native';

export default function CollapsibleBasic() {
    return (
        <View style={{ maxWidth: 400 }}>
            <Collapsible>
                <Collapsible.Trigger>Show details</Collapsible.Trigger>
                <Collapsible.Content>
                    <Text variant="body-sm">
                        This content is hidden until the trigger is pressed. On web it animates via a CSS max-height
                        transition.
                    </Text>
                </Collapsible.Content>
            </Collapsible>
        </View>
    );
}
