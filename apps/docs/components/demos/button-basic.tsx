import { Button, VStack } from '@nori-ui/core';

export default function ButtonBasic() {
    return (
        <VStack gap={3}>
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button loading>Saving…</Button>
        </VStack>
    );
}
