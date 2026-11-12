import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { HStack } from '../HStack';
import { VStack } from '../VStack';
import { Chip } from './Chip';

const meta: Meta<typeof Chip> = {
    title: 'Controls/Chip',
    component: Chip,
};
export default meta;
type Story = StoryObj<typeof Chip>;

function FilterChip() {
    const [selected, setSelected] = useState(false);
    return (
        <Chip selected={selected} onSelectedChange={setSelected}>
            Open issues
        </Chip>
    );
}

function RemovableTags() {
    const [tags, setTags] = useState(['React', 'TypeScript', 'Expo']);
    return (
        <HStack gap={2} align="center">
            {tags.map((tag) => (
                <Chip key={tag} variant="soft" onRemove={() => setTags((prev) => prev.filter((t) => t !== tag))}>
                    {tag}
                </Chip>
            ))}
        </HStack>
    );
}

function TopicFilters() {
    const [topics, setTopics] = useState<string[]>(['design']);
    return (
        <Chip.Group type="multiple" value={topics} onChange={setTopics} aria-label="Filter by topic">
            <Chip value="design">Design</Chip>
            <Chip value="engineering">Engineering</Chip>
            <Chip value="product">Product</Chip>
            <Chip value="research">Research</Chip>
        </Chip.Group>
    );
}

function SortOrder() {
    const [sort, setSort] = useState<string | undefined>('newest');
    return (
        <Chip.Group type="single" value={sort} onChange={setSort} aria-label="Sort order">
            <Chip value="newest">Newest</Chip>
            <Chip value="popular">Popular</Chip>
            <Chip value="rating">Top rated</Chip>
        </Chip.Group>
    );
}

export const Variants: Story = {
    render: () => (
        <VStack gap={3}>
            <HStack gap={2} align="center">
                <Chip variant="outline">Outline</Chip>
                <Chip variant="soft">Soft</Chip>
                <Chip variant="solid">Solid</Chip>
            </HStack>
            <HStack gap={2} align="center">
                <Chip variant="outline" defaultSelected>
                    Outline
                </Chip>
                <Chip variant="soft" defaultSelected>
                    Soft
                </Chip>
                <Chip variant="solid" defaultSelected>
                    Solid
                </Chip>
            </HStack>
        </VStack>
    ),
};

export const Sizes: Story = {
    render: () => (
        <HStack gap={2} align="center">
            <Chip size="sm" onPress={() => undefined}>
                Small
            </Chip>
            <Chip size="md" onPress={() => undefined}>
                Medium
            </Chip>
        </HStack>
    ),
};

export const Filter: Story = { render: () => <FilterChip /> };
export const Removable: Story = { render: () => <RemovableTags /> };
export const GroupMultiple: Story = { render: () => <TopicFilters /> };
export const GroupSingle: Story = { render: () => <SortOrder /> };

export const Disabled: Story = {
    render: () => (
        <Chip disabled defaultSelected onRemove={() => undefined}>
            Locked
        </Chip>
    ),
};
