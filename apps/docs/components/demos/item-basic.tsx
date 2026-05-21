import { Badge, Item, VStack } from '@nori-ui/core';

export default function ItemBasic() {
    return (
        <VStack style={{ maxWidth: 400 }}>
            <Item title="Profile" description="Manage your account settings" chevron onPress={() => {}} />
            <Item title="Notifications" description="Push, email, and SMS alerts" chevron onPress={() => {}} />
            <Item
                title="Plan"
                description="Current subscription"
                trailing={<Badge tone="primary">Pro</Badge>}
                chevron
                onPress={() => {}}
            />
        </VStack>
    );
}
