import { defaultSemanticIcons, HStack, Icon } from '@nori-ui/core';

export default function IconBasic() {
    return (
        <HStack gap={6}>
            <Icon as={defaultSemanticIcons.chevronDown} size="md" />
            <Icon as={defaultSemanticIcons.check} size="md" />
            <Icon as={defaultSemanticIcons.x} size="md" />
        </HStack>
    );
}
