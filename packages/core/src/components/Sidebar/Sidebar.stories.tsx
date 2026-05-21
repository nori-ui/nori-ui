import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { Text } from '../Text';
import { Sidebar } from './Sidebar';

const meta: Meta<typeof Sidebar> = {
    title: 'Navigation/Sidebar',
    component: Sidebar,
};
export default meta;
type Story = StoryObj<typeof Sidebar>;

function HomeIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
                d="M2 6.5L8 1l6 5.5V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
            />
        </svg>
    );
}

function UsersIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            <path
                d="M1 13c0-2.761 2.239-5 5-5s5 2.239 5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M14 13c0-2.21-1.79-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function CogIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            <path
                d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M2.929 2.929l1.06 1.06M11.01 11.01l1.06 1.06M2.929 13.07l1.06-1.06M11.01 4.99l1.06-1.06"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    );
}

export const Default: Story = {
    render: () => (
        <View style={{ height: 500, position: 'relative' as const }}>
            <Sidebar defaultCollapsed={false}>
                <Sidebar.Header>
                    <Text style={{ fontWeight: 'bold' }}>Acme Inc.</Text>
                </Sidebar.Header>
                <Sidebar.Content>
                    <Sidebar.Group>
                        <Sidebar.GroupLabel>Main</Sidebar.GroupLabel>
                        <Sidebar.Menu>
                            <Sidebar.MenuItem icon={<HomeIcon />} active onPress={() => {}}>
                                Home
                            </Sidebar.MenuItem>
                            <Sidebar.MenuItem icon={<UsersIcon />} onPress={() => {}}>
                                Team
                            </Sidebar.MenuItem>
                        </Sidebar.Menu>
                    </Sidebar.Group>
                    <Sidebar.Group>
                        <Sidebar.GroupLabel>Settings</Sidebar.GroupLabel>
                        <Sidebar.Menu>
                            <Sidebar.MenuItem icon={<CogIcon />} onPress={() => {}}>
                                Preferences
                            </Sidebar.MenuItem>
                        </Sidebar.Menu>
                    </Sidebar.Group>
                </Sidebar.Content>
                <Sidebar.Footer>
                    <Text style={{ fontSize: 13, opacity: 0.6 }}>v1.0.0</Text>
                </Sidebar.Footer>
            </Sidebar>
        </View>
    ),
};

export const Collapsed: Story = {
    render: () => (
        <View style={{ height: 500, position: 'relative' as const }}>
            <Sidebar defaultCollapsed>
                <Sidebar.Header>
                    <Text style={{ fontWeight: 'bold' }}>AI</Text>
                </Sidebar.Header>
                <Sidebar.Content>
                    <Sidebar.Group>
                        <Sidebar.GroupLabel>Main</Sidebar.GroupLabel>
                        <Sidebar.Menu>
                            <Sidebar.MenuItem icon={<HomeIcon />} active onPress={() => {}}>
                                Home
                            </Sidebar.MenuItem>
                            <Sidebar.MenuItem icon={<UsersIcon />} onPress={() => {}}>
                                Team
                            </Sidebar.MenuItem>
                            <Sidebar.MenuItem icon={<CogIcon />} onPress={() => {}}>
                                Preferences
                            </Sidebar.MenuItem>
                        </Sidebar.Menu>
                    </Sidebar.Group>
                </Sidebar.Content>
                <Sidebar.Footer>
                    <Text style={{ fontSize: 13, opacity: 0.6 }}>⚙</Text>
                </Sidebar.Footer>
            </Sidebar>
        </View>
    ),
};

export const Floating: Story = {
    render: () => (
        <View
            style={{
                height: 500,
                backgroundColor: '#f3f4f6',
                position: 'relative' as const,
            }}
        >
            <Sidebar variant="floating" defaultCollapsed={false}>
                <Sidebar.Header>
                    <Text style={{ fontWeight: 'bold' }}>Floating</Text>
                </Sidebar.Header>
                <Sidebar.Content>
                    <Sidebar.Group>
                        <Sidebar.Menu>
                            <Sidebar.MenuItem icon={<HomeIcon />} active onPress={() => {}}>
                                Home
                            </Sidebar.MenuItem>
                            <Sidebar.MenuItem icon={<UsersIcon />} onPress={() => {}}>
                                Team
                            </Sidebar.MenuItem>
                        </Sidebar.Menu>
                    </Sidebar.Group>
                </Sidebar.Content>
            </Sidebar>
        </View>
    ),
};
