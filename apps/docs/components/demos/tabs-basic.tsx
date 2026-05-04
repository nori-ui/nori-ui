import { Tabs, Text, VStack } from '@nori-ui/core';

export default function TabsBasic() {
    return (
        <Tabs defaultValue="overview">
            <Tabs.List>
                <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
                <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
                <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="overview">
                <VStack gap={2}>
                    <Text>Project at a glance — 12 active branches, 3 open PRs.</Text>
                </VStack>
            </Tabs.Content>
            <Tabs.Content value="activity">
                <Text>Latest commits, deploys, and merges show up here.</Text>
            </Tabs.Content>
            <Tabs.Content value="settings">
                <Text>Configure name, visibility, and integrations.</Text>
            </Tabs.Content>
        </Tabs>
    );
}
