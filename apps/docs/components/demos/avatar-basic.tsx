import { Avatar, HStack } from '@nori-ui/core';

export default function AvatarBasic() {
    return (
        <HStack gap={3} align="center">
            <Avatar name="Ada Lovelace" size="sm" />
            <Avatar name="Grace Hopper" />
            <Avatar name="Margaret Hamilton" size="lg" />
            <Avatar size="xl" />
        </HStack>
    );
}
