'use client';

import { Chip, VStack } from '@nori-ui/core';
import { useState } from 'react';

const ALL_TAGS = ['React Native', 'TypeScript', 'Expo'];

export default function ChipBasic() {
    const [topics, setTopics] = useState<string[]>(['design']);
    const [tags, setTags] = useState(ALL_TAGS);
    return (
        <VStack gap={4}>
            <Chip.Group type="multiple" value={topics} onChange={setTopics} aria-label="Filter by topic">
                <Chip value="design">Design</Chip>
                <Chip value="engineering">Engineering</Chip>
                <Chip value="product">Product</Chip>
            </Chip.Group>
            <Chip.Group type="multiple" variant="soft" aria-label="Tags">
                {tags.map((tag) => (
                    <Chip key={tag} onRemove={() => setTags((prev) => prev.filter((other) => other !== tag))}>
                        {tag}
                    </Chip>
                ))}
            </Chip.Group>
        </VStack>
    );
}
