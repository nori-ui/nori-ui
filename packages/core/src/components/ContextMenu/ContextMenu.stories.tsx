import type { Meta, StoryObj } from '@storybook/react';
import { Platform, Text, View } from 'react-native';
import { ContextMenu } from './ContextMenu';

const meta: Meta<typeof ContextMenu> = {
    title: 'Overlays/ContextMenu',
    component: ContextMenu,
};
export default meta;
type Story = StoryObj<typeof ContextMenu>;

export const Basic: Story = {
    render: () => (
        <ContextMenu>
            <ContextMenu.Trigger>
                <View
                    style={{
                        padding: 24,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: '#e4e4e7',
                        borderStyle: 'dashed',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Text style={{ color: '#71717a', fontSize: 14 }}>
                        {Platform.OS === 'web' ? 'Right-click here' : 'Long-press here'}
                    </Text>
                </View>
            </ContextMenu.Trigger>
            <ContextMenu.Content>
                <ContextMenu.Item onSelect={() => {}}>Copy</ContextMenu.Item>
                <ContextMenu.Item onSelect={() => {}}>Paste</ContextMenu.Item>
                <ContextMenu.Item onSelect={() => {}}>Select All</ContextMenu.Item>
                <ContextMenu.Separator />
                <ContextMenu.Item destructive onSelect={() => {}}>
                    Delete
                </ContextMenu.Item>
            </ContextMenu.Content>
        </ContextMenu>
    ),
};

export const OnLongPress: Story = {
    name: 'Long-press / Right-click Platform Demo',
    render: () => (
        <ContextMenu>
            <ContextMenu.Trigger>
                <View
                    style={{
                        padding: 32,
                        backgroundColor: '#fafafa',
                        borderRadius: 12,
                        alignItems: 'center',
                    }}
                >
                    <Text style={{ fontWeight: '600', fontSize: 16, marginBottom: 4 }}>Image Preview</Text>
                    <Text style={{ color: '#71717a', fontSize: 12 }}>
                        {Platform.OS === 'web' ? 'Right-click for context menu' : 'Long-press for context menu'}
                    </Text>
                </View>
            </ContextMenu.Trigger>
            <ContextMenu.Content>
                <ContextMenu.Label>Image</ContextMenu.Label>
                <ContextMenu.Item onSelect={() => {}}>Share</ContextMenu.Item>
                <ContextMenu.Item onSelect={() => {}}>Save to Library</ContextMenu.Item>
                <ContextMenu.Item onSelect={() => {}}>Copy Link</ContextMenu.Item>
                <ContextMenu.Separator />
                <ContextMenu.Item destructive onSelect={() => {}}>
                    Remove
                </ContextMenu.Item>
            </ContextMenu.Content>
        </ContextMenu>
    ),
};
