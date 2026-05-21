'use client';

import { ContextMenu, Text } from '@nori-ui/core';
import { Platform, View } from 'react-native';

export default function ContextMenuBasic() {
    return (
        <ContextMenu>
            <ContextMenu.Trigger>
                <View
                    style={{
                        padding: 24,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: '#e4e4e7',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Text variant="body-sm" className="text-semantic-text-muted">
                        {Platform.OS === 'web' ? 'Right-click here' : 'Long-press here'}
                    </Text>
                </View>
            </ContextMenu.Trigger>
            <ContextMenu.Content>
                <ContextMenu.Item onSelect={() => {}}>Copy</ContextMenu.Item>
                <ContextMenu.Item onSelect={() => {}}>Paste</ContextMenu.Item>
                <ContextMenu.Separator />
                <ContextMenu.Item destructive onSelect={() => {}}>
                    Delete
                </ContextMenu.Item>
            </ContextMenu.Content>
        </ContextMenu>
    );
}
