import { Tabs, TabsContent, TabsList, TabsTrigger, Text, VStack } from '@nori-ui/core';

export default function TabsBasic() {
    return (
        <Tabs defaultValue="overview">
            <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
                <VStack gap={2}>
                    <Text>Project at a glance — 12 active branches, 3 open PRs.</Text>
                </VStack>
            </TabsContent>
            <TabsContent value="activity">
                <Text>Latest commits, deploys, and merges show up here.</Text>
            </TabsContent>
            <TabsContent value="settings">
                <Text>Configure name, visibility, and integrations.</Text>
            </TabsContent>
        </Tabs>
    );
}
