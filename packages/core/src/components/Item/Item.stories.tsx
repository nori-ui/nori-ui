import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from 'react-native';
import { Badge } from '../Badge';
import { VStack } from '../VStack';
import { Item } from './Item';

const meta: Meta<typeof Item> = {
    title: 'Display/Item',
    component: Item,
};
export default meta;
type Story = StoryObj<typeof Item>;

export const Basic: Story = {
    render: () => (
        <VStack style={{ maxWidth: 400 }}>
            <Item title="Profile" description="Manage your account settings" chevron onPress={() => {}} />
            <Item title="Notifications" description="Push, email, and SMS alerts" chevron onPress={() => {}} />
            <Item title="Privacy" chevron onPress={() => {}} />
        </VStack>
    ),
};

export const WithTrailing: Story = {
    render: () => (
        <VStack style={{ maxWidth: 400 }}>
            <Item
                title="Plan"
                description="Current subscription"
                trailing={<Badge tone="primary">Pro</Badge>}
                chevron
                onPress={() => Alert.alert('navigate')}
            />
            <Item title="Storage" description="2.4 GB of 5 GB used" trailing={<Badge tone="warning">48%</Badge>} />
        </VStack>
    ),
};

export const Disabled: Story = {
    render: () => (
        <VStack style={{ maxWidth: 400 }}>
            <Item title="Disabled row" description="This row cannot be tapped" chevron onPress={() => {}} disabled />
        </VStack>
    ),
};
