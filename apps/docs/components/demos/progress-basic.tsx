import { Progress, VStack } from '@nori-ui/core';

export default function ProgressBasic() {
    return (
        <VStack gap={4}>
            <Progress value={25} label="Uploading" />
            <Progress value={64} label="Syncing files" />
            <Progress value={92} label="Almost done" />
        </VStack>
    );
}
