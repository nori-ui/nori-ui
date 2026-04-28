// Icon stories live under `components/Icon/` even though the `Icon`
// implementation actually sits in `packages/core/src/icons/`. Putting
// the stories file inside `components/` keeps the CSF loader's glob
// (`components/**/*.stories.tsx`) simple, and the showcase doesn't care
// where the source file actually lives — only what gets imported.

import type { Meta, StoryObj } from '@storybook/react';
import { defaultSemanticIcons, Icon } from '../../icons';
import { HStack } from '../HStack';

const meta: Meta<typeof Icon> = {
    title: 'Misc/Icon',
    component: Icon,
};
export default meta;
type Story = StoryObj<typeof Icon>;

export const SemanticSet: Story = {
    render: () => (
        <HStack gap={6}>
            <Icon as={defaultSemanticIcons.chevronDown} size="md" />
            <Icon as={defaultSemanticIcons.check} size="md" />
            <Icon as={defaultSemanticIcons.x} size="md" />
        </HStack>
    ),
};
