import type { Meta, StoryObj } from '@storybook/react';
import { Text } from '../Text';
import { Command } from './Command';

const meta: Meta<typeof Command> = {
    title: 'Overlays/Command',
    component: Command,
};
export default meta;
type Story = StoryObj<typeof Command>;

export const Basic: Story = {
    render: () => (
        <Command>
            <Command.Trigger>
                <button
                    type="button"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 14px',
                        borderRadius: 8,
                        border: '1px solid #d1d5db',
                        background: '#fff',
                        cursor: 'pointer',
                        fontSize: 14,
                        color: '#374151',
                    }}
                >
                    Search
                    <kbd
                        style={{
                            fontSize: 11,
                            color: '#6b7280',
                            background: '#f3f4f6',
                            border: '1px solid #e5e7eb',
                            borderRadius: 4,
                            padding: '1px 5px',
                        }}
                    >
                        ⌘K
                    </kbd>
                </button>
            </Command.Trigger>
            <Command.Dialog placeholder="Type a command or search…">
                <Command.Empty>No results found.</Command.Empty>
                <Command.Group heading="Suggestions">
                    <Command.Item onSelect={() => alert('Calendar selected')}>Calendar</Command.Item>
                    <Command.Item onSelect={() => alert('Emoji selected')}>Search Emoji</Command.Item>
                    <Command.Item onSelect={() => alert('Calculator selected')}>Calculator</Command.Item>
                </Command.Group>
                <Command.Group heading="Settings">
                    <Command.Item onSelect={() => alert('Profile selected')}>
                        Profile
                        <Command.Shortcut>⌘P</Command.Shortcut>
                    </Command.Item>
                    <Command.Item onSelect={() => alert('Billing selected')}>
                        Billing
                        <Command.Shortcut>⌘B</Command.Shortcut>
                    </Command.Item>
                    <Command.Item disabled>Disabled item</Command.Item>
                </Command.Group>
            </Command.Dialog>
        </Command>
    ),
};

export const DefaultOpen: Story = {
    render: () => (
        <Command defaultOpen>
            <Command.Trigger>
                <button type="button" style={{ padding: '8px 16px', cursor: 'pointer' }}>
                    Open Palette
                </button>
            </Command.Trigger>
            <Command.Dialog>
                <Command.Group heading="Navigation">
                    <Command.Item onSelect={() => {}}>
                        <Text>Dashboard</Text>
                    </Command.Item>
                    <Command.Item onSelect={() => {}}>
                        <Text>Analytics</Text>
                    </Command.Item>
                    <Command.Item onSelect={() => {}}>
                        <Text>Reports</Text>
                    </Command.Item>
                </Command.Group>
            </Command.Dialog>
        </Command>
    ),
};
