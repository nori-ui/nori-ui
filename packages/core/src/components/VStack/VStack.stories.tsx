import type { Meta, StoryObj } from '@storybook/react';
import { useThemeColors } from '../../theme/use-theme-colors';
import { Text } from '../Text';
import { VStack } from './VStack';

// Inline-styled themed chips (same rationale as HStack.stories): native
// NativeWind className → style isn't fully wired in our story tree, and
// these double as a token-usage demo of `semantic.*` background colors.
function Chip({ label, tone }: { label: string; tone: 'primary' | 'subtle' | 'muted' }) {
    const colors = useThemeColors();
    const bg =
        tone === 'primary'
            ? colors.semantic.interactive.primary
            : tone === 'subtle'
              ? colors.semantic.background.subtle
              : colors.semantic.border.default;
    const fg = tone === 'primary' ? colors.semantic.text.inverted : colors.semantic.text.default;
    return (
        <Text
            style={{
                backgroundColor: bg,
                color: fg,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 6,
                overflow: 'hidden',
            }}
        >
            {label}
        </Text>
    );
}

const meta: Meta<typeof VStack> = {
    title: 'Primitives/VStack',
    component: VStack,
    render: (args) => (
        <VStack {...args}>
            <Chip label="A" tone="primary" />
            <Chip label="B" tone="subtle" />
            <Chip label="C" tone="muted" />
        </VStack>
    ),
};
export default meta;

export const Default: StoryObj<typeof VStack> = {};
export const WithGap: StoryObj<typeof VStack> = { args: { gap: 4 } };
