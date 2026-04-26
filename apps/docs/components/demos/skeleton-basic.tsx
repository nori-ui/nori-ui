import { HStack, Skeleton, VStack } from '@nori-ui/core';

export default function SkeletonBasic() {
    return (
        <HStack gap={3} align="center">
            <Skeleton width={48} height={48} radius="full" />
            <VStack gap={2} className="flex-1">
                <Skeleton width="40%" height={14} />
                <Skeleton width="80%" height={12} />
            </VStack>
        </HStack>
    );
}
