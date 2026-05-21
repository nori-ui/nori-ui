import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Button } from '../Button';
import { Sheet } from './Sheet';

const meta: Meta<typeof Sheet> = {
    title: 'Overlays/Sheet',
    component: Sheet,
};
export default meta;
type Story = StoryObj<typeof Sheet>;

// ─── Basic ────────────────────────────────────────────────────────────────────

export const Basic: Story = {
    render: () => (
        <Sheet side="bottom" size="md">
            <Sheet.Trigger>
                <Button>Open sheet</Button>
            </Sheet.Trigger>
            <Sheet.Panel>
                <Sheet.Header>
                    <Sheet.Title>Sheet title</Sheet.Title>
                    <Sheet.Description>This is the sheet description.</Sheet.Description>
                </Sheet.Header>
                <Sheet.Body>
                    <Text>Sheet content goes here.</Text>
                </Sheet.Body>
                <Sheet.Footer>
                    <Sheet.Close>
                        <Button variant="secondary">Cancel</Button>
                    </Sheet.Close>
                    <Sheet.Close>
                        <Button>Done</Button>
                    </Sheet.Close>
                </Sheet.Footer>
            </Sheet.Panel>
        </Sheet>
    ),
};

// ─── Bottom sheet ─────────────────────────────────────────────────────────────

export const BottomSheet: Story = {
    render: () => (
        <Sheet side="bottom" size="lg">
            <Sheet.Trigger>
                <Button>Open bottom sheet</Button>
            </Sheet.Trigger>
            <Sheet.Panel>
                <Sheet.Header>
                    <Sheet.Title>Bottom sheet</Sheet.Title>
                    <Sheet.Description>Slides up from the bottom edge.</Sheet.Description>
                </Sheet.Header>
                <Sheet.Body>
                    <Text>Content in a large bottom sheet.</Text>
                </Sheet.Body>
                <Sheet.Footer>
                    <Sheet.Close>
                        <Button>Close</Button>
                    </Sheet.Close>
                </Sheet.Footer>
            </Sheet.Panel>
        </Sheet>
    ),
};

// ─── Side panel (right) ───────────────────────────────────────────────────────

export const SidePanel: Story = {
    render: () => (
        <Sheet side="right" size="md">
            <Sheet.Trigger>
                <Button>Open side panel</Button>
            </Sheet.Trigger>
            <Sheet.Panel>
                <Sheet.Header>
                    <Sheet.Title>Settings</Sheet.Title>
                    <Sheet.Description>Manage your preferences.</Sheet.Description>
                </Sheet.Header>
                <Sheet.Body>
                    <View style={{ gap: 12 }}>
                        <Text>Profile</Text>
                        <Text>Notifications</Text>
                        <Text>Privacy</Text>
                        <Text>Security</Text>
                    </View>
                </Sheet.Body>
                <Sheet.Footer>
                    <Sheet.Close>
                        <Button variant="secondary">Cancel</Button>
                    </Sheet.Close>
                    <Sheet.Close>
                        <Button>Save</Button>
                    </Sheet.Close>
                </Sheet.Footer>
            </Sheet.Panel>
        </Sheet>
    ),
};

// ─── With form ────────────────────────────────────────────────────────────────

export const WithForm: Story = {
    render: () => (
        <Sheet side="bottom" size="lg">
            <Sheet.Trigger>
                <Button>Edit profile</Button>
            </Sheet.Trigger>
            <Sheet.Panel>
                <Sheet.Header>
                    <Sheet.Title>Edit profile</Sheet.Title>
                    <Sheet.Description>Update your display name and bio.</Sheet.Description>
                </Sheet.Header>
                <Sheet.Body>
                    <View style={{ gap: 16 }}>
                        <View style={{ gap: 6 }}>
                            <Text style={{ fontSize: 14, fontWeight: '500' }}>Display name</Text>
                            <TextInput
                                style={{
                                    borderWidth: 1,
                                    borderColor: '#ccc',
                                    borderRadius: 8,
                                    padding: 10,
                                    fontSize: 14,
                                }}
                                placeholder="Your name"
                            />
                        </View>
                        <View style={{ gap: 6 }}>
                            <Text style={{ fontSize: 14, fontWeight: '500' }}>Bio</Text>
                            <TextInput
                                style={{
                                    borderWidth: 1,
                                    borderColor: '#ccc',
                                    borderRadius: 8,
                                    padding: 10,
                                    fontSize: 14,
                                    height: 80,
                                }}
                                placeholder="Tell us about yourself"
                                multiline
                            />
                        </View>
                    </View>
                </Sheet.Body>
                <Sheet.Footer>
                    <Sheet.Close>
                        <Button variant="secondary">Cancel</Button>
                    </Sheet.Close>
                    <Sheet.Close>
                        <Button>Save changes</Button>
                    </Sheet.Close>
                </Sheet.Footer>
            </Sheet.Panel>
        </Sheet>
    ),
};

// ─── Controlled ───────────────────────────────────────────────────────────────

export const Controlled: Story = {
    render: () => {
        const [open, setOpen] = useState(false);
        return (
            <View style={{ gap: 12, alignItems: 'flex-start' }}>
                <Button onPress={() => setOpen(true)}>Open (controlled)</Button>
                <Text>Sheet is: {open ? 'open' : 'closed'}</Text>
                <Sheet open={open} onOpenChange={setOpen} side="bottom" size="sm">
                    <Sheet.Panel>
                        <Sheet.Header>
                            <Sheet.Title>Controlled sheet</Sheet.Title>
                            <Sheet.Description>Parent state drives open.</Sheet.Description>
                        </Sheet.Header>
                        <Sheet.Body>
                            <Text>The parent owns the open state.</Text>
                        </Sheet.Body>
                        <Sheet.Footer>
                            <Button onPress={() => setOpen(false)}>Close</Button>
                        </Sheet.Footer>
                    </Sheet.Panel>
                </Sheet>
            </View>
        );
    },
};
