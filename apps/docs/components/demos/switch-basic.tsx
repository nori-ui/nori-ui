import { Switch, VStack } from '@nori-ui/core';

export default function SwitchBasic() {
    return (
        <VStack gap={3}>
            <Switch label="Dark mode" />
            <Switch label="Notifications" defaultChecked />
        </VStack>
    );
}
