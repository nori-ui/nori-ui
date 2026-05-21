import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { Button } from '../Button';
import { DropdownMenu } from './DropdownMenu';

const meta: Meta<typeof DropdownMenu> = {
    title: 'Overlays/DropdownMenu',
    component: DropdownMenu,
};
export default meta;
type Story = StoryObj<typeof DropdownMenu>;

export const Basic: Story = {
    render: () => (
        <DropdownMenu>
            <DropdownMenu.Trigger>
                <Button variant="secondary">Options</Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
                <DropdownMenu.Item onSelect={() => {}}>Edit</DropdownMenu.Item>
                <DropdownMenu.Item onSelect={() => {}}>Duplicate</DropdownMenu.Item>
                <DropdownMenu.Item onSelect={() => {}}>Archive</DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu>
    ),
};

export const WithIcons: Story = {
    render: () => (
        <DropdownMenu>
            <DropdownMenu.Trigger>
                <Button variant="secondary">File</Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
                <DropdownMenu.Item
                    icon={<View style={{ width: 16, height: 16, backgroundColor: '#6366f1', borderRadius: 2 }} />}
                    shortcut="⌘N"
                    onSelect={() => {}}
                >
                    New File
                </DropdownMenu.Item>
                <DropdownMenu.Item
                    icon={<View style={{ width: 16, height: 16, backgroundColor: '#22c55e', borderRadius: 2 }} />}
                    shortcut="⌘O"
                    onSelect={() => {}}
                >
                    Open
                </DropdownMenu.Item>
                <DropdownMenu.Item
                    icon={<View style={{ width: 16, height: 16, backgroundColor: '#f59e0b', borderRadius: 2 }} />}
                    shortcut="⌘S"
                    onSelect={() => {}}
                >
                    Save
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu>
    ),
};

export const WithDestructive: Story = {
    render: () => (
        <DropdownMenu>
            <DropdownMenu.Trigger>
                <Button variant="secondary">Actions</Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
                <DropdownMenu.Item onSelect={() => {}}>Edit</DropdownMenu.Item>
                <DropdownMenu.Item onSelect={() => {}}>Share</DropdownMenu.Item>
                <DropdownMenu.Item disabled onSelect={() => {}}>
                    Export (disabled)
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item destructive onSelect={() => {}}>
                    Delete
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu>
    ),
};

export const WithSeparatorAndLabel: Story = {
    render: () => (
        <DropdownMenu>
            <DropdownMenu.Trigger>
                <Button variant="secondary">My Account</Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
                <DropdownMenu.Label>Account</DropdownMenu.Label>
                <DropdownMenu.Item onSelect={() => {}}>Profile</DropdownMenu.Item>
                <DropdownMenu.Item onSelect={() => {}}>Settings</DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Label>Support</DropdownMenu.Label>
                <DropdownMenu.Item onSelect={() => {}}>Documentation</DropdownMenu.Item>
                <DropdownMenu.Item onSelect={() => {}}>Contact Support</DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item destructive onSelect={() => {}}>
                    Log Out
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu>
    ),
};
